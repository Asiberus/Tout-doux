#!/bin/sh

set -e

INDEX_PATH=/frontend/public/index.html
VERSION=${VERSION}
API_URL=${API_URL}

echo "Setup config variables :"
echo "- VERSION = $VERSION"
echo "- API_URL = $API_URL"

sed -i "s~<meta property=\"VERSION\" content=\".*\" />~<meta property=\"VERSION\" content=\"$VERSION\" />~g" $INDEX_PATH
sed -i "s~<meta property=\"API_URL\" content=\".*\" />~<meta property=\"API_URL\" content=\"$API_URL\" />~g" $INDEX_PATH

echo "Config variables successfully set!"