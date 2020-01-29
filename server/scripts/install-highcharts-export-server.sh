#!/usr/bin/env sh

export ACCEPT_HIGHCHARTS_LICENSE=1
export HIGHCHARTS_VERSION=6.2.0
export HIGHCHARTS_USE_STYLED=1
export HIGHCHARTS_MOMENT=1

npm install -g highcharts-export-server

# Hack to force mkdirp version
# until https://github.com/highcharts/node-export-server/pull/231 is merged
MODULES_DIR=`npm root -g`
npm install -g mkdirp@0.5.1
rm -Rf $MODULES_DIR/highcharts-export-server/node_modules/mkdirp
ln -s $MODULES_DIR/mkdirp $MODULES_DIR/highcharts-export-server/node_modules/mkdirp
