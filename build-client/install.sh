#!bin/sh

set -e

GITHUB_URL=https://github.com/appveen/orcli/service

info()
{
    echo '[INFO] ' "$@"
}
warn()
{
    echo '[WARN] ' "$@" >&2
}
fatal()
{
    echo '[ERROR] ' "$@" >&2
    exit 1
}


cd /lib/systemd/system

wget -qO $GITHUB_URL/orcli.service


cd /usr/bin
wget -qO $GITHUB_URL/orcli-service