#!/usr/bin/env sh

export ACCEPT_HIGHCHARTS_LICENSE=1
export HIGHCHARTS_VERSION=6.2.0
export HIGHCHARTS_USE_STYLED=1
export HIGHCHARTS_MOMENT=1

# Hack to force using a newer commit form github
# due to issues with uui module version requirements
npm install -g highcharts/node-export-server#e3bd98c
# npm install -g highcharts-export-server
