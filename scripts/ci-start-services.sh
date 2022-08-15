#!/usr/bin/env bash

if [ "$SERVER" == "true" ]; then
    docker-compose -f .travis-docker-compose.yml up -d
    while ! curl -sfo /dev/null 'http://localhost:9200/'; do echo -n '.' && sleep .5; done
fi
