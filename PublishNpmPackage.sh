#!/bin/bash

cp .npmrc-ci .npmrc
npm i
npm install -g npm-cli-adduser
npm run build
echo "#### Login to Nexus ####"
npm-cli-adduser -u $NPM_USERNAME -p $NPM_PASSWORD -e $NPM_EMAIL -r "${NEXUS_HOST}"
echo "#### Publish new package ####"
npm publish . --registry="${NEXUS_HOST}" --tag latest
