#!/usr/bin/env bash
npx pwa-asset-generator ./logo.svg ./icons --maskable --opaque
rm -f ./icons/apple-splash-*.jpg
