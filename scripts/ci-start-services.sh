#!/usr/bin/env bash

if [ "$SERVER" == "true" ]; then
    python3 -u -m analytics.reports.highcharts_server &
    docker-compose -f .travis-docker-compose.yml up -d
    while ! curl -sfo /dev/null 'http://localhost:9200/'; do echo -n '.' && sleep .5; done
fi
