FROM mcr.microsoft.com/playwright:v1.58.2-noble
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    xvfb x11vnc novnc websockify && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN chmod +x docker-start.sh && mkdir -p /app/runs /app/test-results
ENV PORT=3000 HEADED=1 DISPLAY=:99 SLOW_MO=200
EXPOSE 3000 6080
CMD ["./docker-start.sh"]
