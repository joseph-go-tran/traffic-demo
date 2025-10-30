#!/bin/sh
set -e

# Replace environment variables in index.html
echo "Injecting runtime configuration..."

# Get the API URL from environment or use empty string
VITE_API_URL="${VITE_API_URL:-}"
VITE_NOTIFICATION_WS_URL="${VITE_NOTIFICATION_WS_URL:-}"

echo "VITE_API_URL: ${VITE_API_URL}"
echo "VITE_NOTIFICATION_WS_URL: ${VITE_NOTIFICATION_WS_URL}"

# Replace placeholder in all HTML files
find /usr/share/nginx/html -type f -name "*.html" -exec sed -i \
  "s|__VITE_API_URL__|${VITE_API_URL}|g" {} \;

find /usr/share/nginx/html -type f -name "*.js" -exec sed -i \
  "s|__VITE_NOTIFICATION_WS_URL__|${VITE_NOTIFICATION_WS_URL}|g" {} \;

echo "Configuration injected successfully"


# Start nginx
exec nginx -g 'daemon off;'
