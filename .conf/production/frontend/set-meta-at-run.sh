#!/bin/sh

set -e

: "${API_URL:?API_URL must be set in the container environment}"

INDEX_PATH=/usr/share/nginx/html/index.html

sed -i "s~<meta property=\"API_URL\" content=\".*\" />~<meta property=\"API_URL\" content=\"$API_URL\" />~g" $INDEX_PATH

echo "API_URL = $API_URL"
