require('dotenv').config({quiet:true});
const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');
const cases = require('./cases');
const app = express();
const root = path.resolve(__dirname, '..');
const runsDir = path.resolve(
  process.env.RUNS_DIR || path.join(root, 'runs')
);
fs.mkdirSync(runsDir, { recursive: true });
console.log('Project root:', root);
console.log('Report directory:', runsDir);
app.disable('x-powered-by');
app.use(express.json({limit:'24kb'}));
app.use(express.static(path.join(root,'public')));
let current = null;
const activeClients = new Set();
const state = {runId:null, running:false, selected:[], completed:[], currentCase:null, startedAt:null, log:[], error:null};
function emit(message){
  const payload = `data: ${JSON.stringify(message)}\n\n`;
  for(const res of activeClients) res.write(payload);
}
function update(patch){Object.assign(state,patch);emit({type:'state',state});}
function pushLog(message){state.log.push(message); if(state.log.length>300)state.log.shift();emit({type:'log',message});}
function safeId(id){return typeof id==='string' && /^[A-Za-z0-9-]+$/.test(id) && id.length<=90;}
function loadReport(id){
 if(!safeId(id))return null;
 const file=path.join(runsDir,id,'summary.json');
 if(!fs.existsSync(file))return null;
 try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}
}
function collectTests(suites,found=[]){for(const s of suites||[]){for(const spec of s.specs||[])for(const test of spec.tests||[])found.push({title:spec.title,tests:[test]});collectTests(s.suites,found);}return found;}
function shortErr(test){const result=(test.results||[]).at(-1);return result?.error?.message||result?.errors?.map(e=>e.message).filter(Boolean).join('\n')||'';}
function parseResult(jsonFile,tc,elapsed,exitCode){
 if(!fs.existsSync(jsonFile))return {id:tc.id,title:tc.title,criticality:tc.criticality,status:'failed',durationMs:elapsed,reason:'No JSON report was generated. Exit code: '+exitCode};
 try{
   const data=JSON.parse(fs.readFileSync(jsonFile,'utf8'));
   const specs=collectTests(data.suites);
   const test=specs[0]?.tests[0];
   if(!test)return {id:tc.id,title:tc.title,criticality:tc.criticality,status:'failed',durationMs:elapsed,reason:'No matching test case was executed. Verify --grep and the test title.'};
   const status=test.status==='expected'?'passed':test.status==='skipped'?'skipped':'failed';
   const artifacts=[];
   for(const result of test.results||[])for(const attachment of result.attachments||[]){
      if(attachment.path && fs.existsSync(attachment.path)){
        const destDir=path.join(path.dirname(jsonFile),'attachments');fs.mkdirSync(destDir,{recursive:true});
        const ext=path.extname(attachment.path)||'.bin';
        const dest=path.join(destDir,crypto.randomUUID()+ext);
        fs.copyFileSync(attachment.path,dest);
        artifacts.push({name:attachment.name, url:`/api/runs/${path.basename(path.dirname(jsonFile))}/attachments/${path.basename(dest)}`});
      }
   }
   return {id:tc.id,title:tc.title,criticality:tc.criticality,status,durationMs:test.results?.reduce((n,r)=>n+(r.duration||0),0)||elapsed,reason:shortErr(test),retries:Math.max(0,(test.results?.length||1)-1),artifacts};
 }catch(e){return {id:tc.id,title:tc.title,criticality:tc.criticality,status:'failed',durationMs:elapsed,reason:'Failed to parse Playwright output: '+e.message};}
}
async function execute(ids){
 const runId=new Date().toISOString().replace(/[:.]/g,'-')+'-'+crypto.randomBytes(3).toString('hex');
 const runFolder=path.join(runsDir,runId);fs.mkdirSync(runFolder,{recursive:true});
 const selected=ids.map(id=>cases.find(c=>c.id===id));
 const report={id:runId,startedAt:new Date().toISOString(),finishedAt:null,results:[],selected:ids,headed:process.env.HEADED==='1'};
 current=runId;update({runId,running:true,selected:ids,completed:[],currentCase:null,startedAt:report.startedAt,log:[],error:null});
 for(const tc of selected){
  update({currentCase:tc.id});pushLog(`Starting: ${tc.title}`);
  const jsonFile=path.join(runFolder,tc.id+'.json');
  const start=Date.now();
  const code=await new Promise(resolve=>{
    const args=['test',`tests/${tc.file}`,'--grep',tc.grep,'--project=chromium'];
    const env={...process.env, REPORT_JSON_PATH:jsonFile,REPORT_HTML_DIR:path.join(runFolder,'html-'+tc.id),TEST_OUTPUT_DIR:path.join(runFolder,'artifacts-'+tc.id)};
    const cp=spawn(path.join(root,'node_modules','.bin','playwright'),args,{cwd:root,env,stdio:['ignore','pipe','pipe']});
    for(const stream of [cp.stdout,cp.stderr])stream.on('data',chunk=>{for(const line of chunk.toString().split(/\r?\n/).filter(Boolean))pushLog(line.slice(0,400));});
    cp.on('error',error=>{pushLog('Process error: '+error.message);resolve(127);});
    cp.on('close',code=>resolve(code??1));
  });
  report.results.push(parseResult(jsonFile,tc,Date.now()-start,code));
  fs.writeFileSync(path.join(runFolder,'summary.json'),JSON.stringify(report,null,2));
  update({completed:report.results.slice()});pushLog(`Finished: ${tc.title} (${report.results.at(-1).status})`);
 }
 report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(runFolder,'summary.json'),JSON.stringify(report,null,2));
 update({running:false,currentCase:null,completed:report.results.slice()});pushLog('Run completed');
}
app.get('/api/cases',(_,res)=>res.json(cases));
app.get('/api/state',(_,res)=>res.json(state));
app.get('/api/events',(req,res)=>{
 res.setHeader('Content-Type','text/event-stream');res.setHeader('Cache-Control','no-cache');res.setHeader('Connection','keep-alive');res.flushHeaders();
 activeClients.add(res);res.write(`data: ${JSON.stringify({type:'state',state})}\n\n`);
 const keepAlive=setInterval(()=>res.write(': ping\n\n'),15000);
 req.on('close',()=>{clearInterval(keepAlive);activeClients.delete(res);});
});
app.post('/api/runs',(req,res)=>{
 const ids=req.body?.ids;
 if(state.running)return res.status(409).json({error:'A test run is already active. Wait for it to finish.'});
 if(!Array.isArray(ids)||!ids.length||ids.length>cases.length||new Set(ids).size!==ids.length||ids.some(id=>!cases.find(c=>c.id===id)))return res.status(400).json({error:'Choose one or more valid, unique test cases.'});
 // Run single worker sequentially, so the headed VNC display shows the selected test.
 execute(ids).catch(error=>{pushLog(error.stack||error.message);update({running:false,error:error.message,currentCase:null});});
 res.status(202).json({accepted:true});
});

app.get('/api/runs', (req, res) => {
  try {
    const folders = fs.readdirSync(runsDir, {
      withFileTypes: true
    });

    const reports = folders
      .filter(folder => folder.isDirectory())
      .map(folder => {
        const summaryPath = path.join(
          runsDir,
          folder.name,
          'summary.json'
        );

        if (!fs.existsSync(summaryPath)) {
          console.warn('Missing summary:', summaryPath);
          return null;
        }

        try {
          const report = JSON.parse(
            fs.readFileSync(summaryPath, 'utf8')
          );

          return {
            id: report.id,
            startedAt: report.startedAt,
            finishedAt: report.finishedAt,
            passed: (report.results || []).filter(
              result => result.status === 'passed'
            ).length,
            total: report.selected?.length ||
              report.results?.length || 0
          };
        } catch (error) {
          console.error(
            'Error reading report:',
            summaryPath,
            error.message
          );
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) =>
        (b.startedAt || '').localeCompare(
          a.startedAt || ''
        )
      )
      .slice(0, 30);

    console.log('Available reports:', reports.length);

    res.json(reports);

  } catch (error) {
    console.error('Report API error:', error);

    res.status(500).json({
      error: 'Failed to load reports'
    });
  }
});

app.get('/api/runs/:id', (req,res)=>{const item=loadReport(req.params.id);if(!item)return res.sendStatus(404);res.json(item);});
app.get('/api/runs/:id/attachments/:name',(req,res)=>{
 if(!safeId(req.params.id)||!/^[a-f0-9-]+\.(png|webm|zip|txt|jpg|jpeg)$/.test(req.params.name))return res.sendStatus(400);
 const file=path.join(runsDir,req.params.id,'attachments',req.params.name);
 res.sendFile(file,err=>{if(err && !res.headersSent)res.sendStatus(404);});
});
app.get('/health',(_,res)=>res.json({ok:true,running:state.running}));
const port=Number(process.env.PORT||3000);
app.listen(port,'0.0.0.0',()=>console.log(`QA dashboard ready: http://localhost:${port}`));
