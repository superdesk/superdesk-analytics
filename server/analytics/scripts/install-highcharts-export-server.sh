#!/usr/bin/env sh

export ACCEPT_HIGHCHARTS_LICENSE=1
export HIGHCHARTS_VERSION=6.2.0
export HIGHCHARTS_USE_STYLED=1
export HIGHCHARTS_MOMENT=1

echo "----------------------------"
echo "installing highcharts server"
npm install --prefix "$(dirname "$0")/.." highcharts-export-server@2.1
