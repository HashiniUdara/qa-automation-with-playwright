
const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function formatDuration(ms) {
  return ((Number(ms) || 0) / 1000).toFixed(1) + 's';
}

function renderReport(report) {
  const results = report.results || [];
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const total = results.length;
  const rate = total ? (passed / total * 100).toFixed(1) : '0.0';

  const duration = report.finishedAt
    ? new Date(report.finishedAt) - new Date(report.startedAt)
    : results.reduce((sum, r) => sum + (r.durationMs || 0), 0);

  $('generated').textContent =
    'Generated: ' + new Date(report.startedAt).toLocaleString();

  $('stats').innerHTML = [
    ['Total Test Cases', total],
    ['Tests Passed', passed],
    ['Tests Failed', failed],
    ['Passed Percentage', rate + '%'],
    ['Skipped', skipped],
    ['Test Duration', formatDuration(duration)]
  ].map(([label, value]) => `
    <div class="stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');

  const levels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  $('criticality').innerHTML = levels.map(level => {
    const group = results.filter(r => r.criticality === level);
    const p = group.filter(r => r.status === 'passed').length;
    const f = group.filter(r => r.status === 'failed').length;
    const pct = group.length ? (p / group.length * 100).toFixed(1) : '0.0';

    return `
      <tr>
        <td><span class="badge ${level.toLowerCase()}">${level}</span></td>
        <td>${group.length}</td>
        <td>${p}</td>
        <td>${f}</td>
        <td>${pct}%</td>
      </tr>
    `;
  }).join('');

  $('results').innerHTML = results.map((r, index) => {
    const screenshot = (r.artifacts || []).find(a =>
      a.name?.toLowerCase().includes('screenshot') ||
      /\.(png|jpg|jpeg)(\?|$)/i.test(a.url || '')
    );

    const screenshotHtml = screenshot
      ? `<a href="${escapeHtml(screenshot.url)}" target="_blank"
           rel="noopener noreferrer">
           <img src="${escapeHtml(screenshot.url)}"
                alt="Failure screenshot"
                style="width:160px;max-width:100%;border-radius:5px;">
         </a>`
      : '-';

    return `
      <tr>
        <td>${index + 1}</td>
        <td><span class="badge ${escapeHtml((r.criticality || '').toLowerCase())}">
          ${escapeHtml(r.criticality)}
        </span></td>
        <td>${escapeHtml(r.title)}</td>
        <td>
          <span class="badge ${
            r.status === 'passed'
              ? 'passed'
              : r.status === 'failed'
                ? 'failed'
                : 'skipped'
          }">
            ${escapeHtml((r.status || 'unknown').toUpperCase())}
          </span>
        </td>
        <td>${formatDuration(r.durationMs)}</td>
        <td>${Number(r.retries) || 0}</td>
        <td style="white-space:pre-wrap;max-width:350px">
          ${escapeHtml(r.reason || '-')}
        </td>
        <td>${screenshotHtml}</td>
      </tr>
    `;
  }).join('');
}

async function loadReport(id) {
  const response = await fetch(`/api/runs/${encodeURIComponent(id)}`);

  if (!response.ok) {
    throw new Error('Failed to load report: HTTP ' + response.status);
  }

  const report = await response.json();
  renderReport(report);
}

async function initialize() {
  const select = $('run-select');

  try {
    const response = await fetch('/api/runs');

    if (!response.ok) {
      throw new Error('Failed to load runs');
    }

    const runs = await response.json();

    if (!runs.length) {
      select.innerHTML = '<option value="">No runs yet</option>';
      $('stats').textContent = 'No runs available.';
      return;
    }

    select.innerHTML = runs.map(run => `
      <option value="${escapeHtml(run.id)}">
        ${escapeHtml(new Date(run.startedAt).toLocaleString())}
        — ${run.passed}/${run.total} passed
      </option>
    `).join('');

    const requestedId = new URLSearchParams(location.search).get('id');
    const selectedId = runs.some(r => r.id === requestedId)
      ? requestedId
      : runs[0].id;

    select.value = selectedId;
    await loadReport(selectedId);

    select.addEventListener('change', async () => {
      try {
        await loadReport(select.value);
        history.replaceState(
          null, '',
          '/report.html?id=' + encodeURIComponent(select.value)
        );
      } catch (error) {
        $('stats').textContent = error.message;
      }
    });

  } catch (error) {
    console.error('Report loading error:', error);
    $('stats').textContent = error.message;
  }
}

document.addEventListener('DOMContentLoaded', initialize);
