#!/bin/bash

rm -rf bin || true

echo "env GOOS=linux GOARCH=386 go build -ldflags="-s -w" -o bin/orcli-client-linux-386 ."
env GOOS=linux GOARCH=386 go build -ldflags="-s -w" -o bin/orcli-client-linux-386 .

echo "env GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/orcli-client-linux-amd64 ."
env GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bin/orcli-client-linux-amd64 .

cd bin

md5sum orcli-client-linux-386 > md5sum.txt
md5sum orcli-client-linux-amd64 >> md5sum.txt