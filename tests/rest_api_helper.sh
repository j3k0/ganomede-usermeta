#!/bin/bash

if [ "x$CLEANUP" = "x1" ]; then
    echo "Cleaning up database"
    docker-compose stop
    docker-compose rm -vf
    docker-compose up -d

    sleep 2
    echo "Initializing couch views"
    docker-compose run -e COUCH_SYNC=1 app node index.js | ./node_modules/.bin/bunyan
fi

set -e

function CURL() {
    if [ "x$RECREATE" = "x1" ]; then
      test -e docker-compose.yml && docker-compose up --no-deps --no-recreate -d || true
    fi
    curl -s -H 'Content-type: application/json' "$@" > .curloutput.txt
    cat .curloutput.txt | json_pp > .testoutput.txt
    # testoutput
}

function json_pp() {
    xargs -0 node -e "console.log(JSON.stringify(JSON.parse(process.argv[1]), null, 2))"
}

function outputIncludes() {
    cat .testoutput.txt | grep "$@" > /dev/null || (echo "      FAIL" && false)
}

function outputExcludes() {
    cat .testoutput.txt | grep "$@" > /dev/null || return 0
    echo "      FAIL" && false
}

function it() {
    echo "    - $@"
}
