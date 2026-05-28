#!/bin/bash
set -e
set -a
. /opt/bitnami/projects/payoffsolar/.env
set +a

MODE="${1:-dryrun}"
MYCNF=$(mktemp)
chmod 600 "$MYCNF"
printf "[client]\nuser=%s\npassword=%s\nhost=%s\nport=%s\n" "$MYSQL_USER" "$MYSQL_PASSWORD" "$MYSQL_HOST" "$MYSQL_PORT" > "$MYCNF"
trap "rm -f $MYCNF" EXIT

echo "--- Preview ---"
mysql --defaults-extra-file="$MYCNF" "$MYSQL_DATABASE" <<'SQL'
SELECT
  COUNT(*) AS orders_to_backfill,
  ROUND(SUM(o.total), 2) AS total_amount,
  MIN(o.order_date) AS earliest,
  MAX(o.order_date) AS latest
FROM orders o
WHERE o.order_date < '2026-02-25'
  AND o.status = 'Complete'
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id);
SQL

if [ "$MODE" = "apply" ]; then
  echo "--- APPLYING INSERT ---"
  mysql --defaults-extra-file="$MYCNF" "$MYSQL_DATABASE" <<'SQL'
START TRANSACTION;
INSERT INTO payments (order_id, payment_date, payment_type, amount, notes)
SELECT o.id, o.order_date, 'Venmo', o.total, NULL
FROM orders o
WHERE o.order_date < '2026-02-25'
  AND o.status = 'Complete'
  AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = o.id);
SELECT ROW_COUNT() AS rows_inserted;
COMMIT;
SELECT COUNT(*) AS payments_venmo_total FROM payments WHERE payment_type = 'Venmo';
SQL
fi
