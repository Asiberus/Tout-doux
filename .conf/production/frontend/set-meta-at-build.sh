#!/bin/sh

set -e

: "${VERSION:?ARG_VERSION must be passed as a build argument}"

INDEX_PATH=/frontend/index.html

sed -i "s~<meta property=\"VERSION\" content=\".*\" />~<meta property=\"VERSION\" content=\"$VERSION\" />~g" $INDEX_PATH

echo "VERSION = $VERSION"
