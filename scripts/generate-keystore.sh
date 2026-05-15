#!/bin/bash
# Einmalig ausführen um den Android Signing-Keystore zu erstellen.
# Das erzeugte keystore.jks NIEMALS ins Git-Repository committen!

set -e

KEYSTORE="keystore.jks"
ALIAS="dmrdashboard"

if [ -f "$KEYSTORE" ]; then
  echo "FEHLER: $KEYSTORE existiert bereits. Löschen wenn du einen neuen erstellen willst."
  exit 1
fi

echo ""
echo "=== DMR Dashboard Android Keystore erstellen ==="
echo ""
echo "Du wirst nach einem Store-Passwort und einem Key-Passwort gefragt."
echo "Notiere beide Passwörter sicher — sie werden als GitHub Secrets benötigt."
echo ""

keytool -genkey -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9125 \
  -dname "CN=DMR Dashboard, OU=DO2EF, O=CS Systems, L=DE, ST=DE, C=DE"

echo ""
echo "=== Keystore erstellt: $KEYSTORE ==="
echo ""
echo "Jetzt als Base64 kodieren und als GitHub Secret hinterlegen:"
echo ""
echo "  base64 -w 0 keystore.jks"
echo ""
echo "Benötigte GitHub Secrets (unter Settings → Secrets → Actions):"
echo "  KEYSTORE_BASE64  → Ausgabe des base64-Befehls oben"
echo "  KEY_ALIAS        → $ALIAS"
echo "  KEY_PASSWORD     → das Key-Passwort das du gerade eingegeben hast"
echo "  STORE_PASSWORD   → das Store-Passwort das du gerade eingegeben hast"
echo ""
echo "WICHTIG: keystore.jks NICHT in Git committen!"
