#!/bin/sh
# Inject BACKEND_URL at runtime into config.js
# This allows changing the API URL without rebuilding the frontend

BACKEND_URL="${BACKEND_URL:-}"

cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  BACKEND_URL: "${BACKEND_URL}"
};
EOF

echo "Runtime config: BACKEND_URL=${BACKEND_URL}"
exec "$@"
