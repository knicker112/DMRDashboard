#!/usr/bin/env bash
# Deploy: npm run build vorher ausführen
set -e

HA_WWW="${HA_WWW_PATH:-/config/www/dmr-dashboard}"

if [ ! -d "dist" ]; then
  echo "dist/ nicht gefunden — erst 'npm run build' ausführen"
  exit 1
fi

echo "Deploye nach $HA_WWW ..."
mkdir -p "$HA_WWW"
cp -r dist/* "$HA_WWW/"
echo "Fertig. HA iFrame-Card URL: /local/dmr-dashboard/index.html"
