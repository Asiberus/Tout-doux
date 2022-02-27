#!/bin/sh

BACKEND_PORT=${BACKEND_PORT}
set -e

echo "BACKEND PORT : $BACKEND_PORT"
python manage.py wait_for_db
python manage.py migrate

uwsgi --socket :"$BACKEND_PORT" --workers 4 --master --enable-threads --module backend.wsgi