#!/bin/bash

SERVICE_NAME="usermeta/v1"
BASE_URL="${BASE_URL:-http://localhost:8000}"
PREFIX="${BASE_URL}/${SERVICE_NAME}"
API_SECRET=${API_SECRET:-1234}

. `dirname $0`/rest_api_helper.sh

# Basics
it 'responds to /ping'
    CURL $PREFIX/ping/ruok
    outputIncludes ruok

it 'responds to /about'
    CURL $PREFIX/about
    outputIncludes ${SERVICE_NAME}

# Private alias
#it 'keep private aliases hidden'
#    CURL $PREFIX/users -d '{"id":"user1","password":"12345678","secret":"'$API_SECRET'", "aliases":[{"type":"private","value":"hidden"}]}'
#    CURL $PREFIX/users/id/user1
#    outputExcludes hidden
#
## Wrong request
#it 'handles wrong requests'
#    CURL $PREFIX/users -d '{"id":"noalias","password":"12345678","secret":"'$API_SECRET'"}'
#    outputExcludes "InternalError"
#    CURL $PREFIX/users/id/noalias
#    outputIncludes noalias
