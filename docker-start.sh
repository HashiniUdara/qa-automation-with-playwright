#!/bin/sh
set -eu
Xvfb :99 -screen 0 1440x900x24 -ac +extension RANDR > /tmp/xvfb.log 2>&1 &
sleep 2
x11vnc -display :99 -forever -shared -nopw -listen 127.0.0.1 -rfbport 5900 > /tmp/vnc.log 2>&1 &
websockify --web /usr/share/novnc/ 0.0.0.0:6080 127.0.0.1:5900 > /tmp/websockify.log 2>&1 &
exec node server/index.js
