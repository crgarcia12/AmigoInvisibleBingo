#!/bin/sh

# Replace environment variables in env-config.js
envsubst < /usr/share/nginx/html/env-config.js > /usr/share/nginx/html/env-config.js.tmp
mv /usr/share/nginx/html/env-config.js.tmp /usr/share/nginx/html/env-config.js

# Start nginx
nginx -g 'daemon off;'
