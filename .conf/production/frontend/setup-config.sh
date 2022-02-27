#!/bin/sh

set -e

INDEX_PATH=/frontend/public/index.html
API_URL=${API_URL}

echo "Setup config variables :"
echo "- API_URL = $API_URL"
sed -i "s~<meta property=\"API_URL\" content=\".*\" />~<meta property=\"API_URL\" content=\"$API_URL\" />~g" $INDEX_PATH
echo "Config variables successfully set!"