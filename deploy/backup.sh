#!/bin/sh
# Daily compressed pg_dump of the LangGo database into /backups (./backups on the host),
# deleting dumps older than BACKUP_KEEP_DAYS. Connection settings come from PG* env vars.
# Restore instructions: docs/DEPLOYMENT.md.
set -eu -o pipefail

mkdir -p /backups

while true; do
  file="/backups/langgo-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
  if pg_dump --no-owner --clean --if-exists | gzip > "$file.partial"; then
    mv "$file.partial" "$file"
    echo "Backup written: $file"
  else
    rm -f "$file.partial"
    echo "Backup FAILED" >&2
  fi

  find /backups -name 'langgo-*.sql.gz' -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete
  sleep 86400
done
