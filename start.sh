#!/usr/bin/env sh
set -eu
corepack enable 2>/dev/null || true
exec pnpm start
