#!/usr/bin/env bash

if [ "$CLIENT" == "true" ]; then
    npm install
fi

if [ "$SERVER" == "true" ]; then
    # Install python package dependencies
    sudo apt-get -y update
    sudo apt-get -y install libxml2-dev libxmlsec1-dev libxmlsec1-openssl

    # Update python core packages
    python -m pip install --upgrade pip wheel setuptools

    # Install Analytics modules
    cd server
    pip install -r requirements.txt
    cd ..
    chmod a+x server/scripts/install-highcharts-export-server.sh
    pip install -e .
fi
