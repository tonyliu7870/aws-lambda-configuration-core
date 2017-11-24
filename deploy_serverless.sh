#!/bin/sh
mkdir .tmp

find dist -type f ! -name '*.d.ts' -exec rsync {} -R .tmp \;
cp package.json .tmp
cp serverless.yml .tmp

(cd .tmp && yarn --prod && serverless deploy "$@")

rm -r .tmp
