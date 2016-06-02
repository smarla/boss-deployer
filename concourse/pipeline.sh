#!/usr/bin/env bash

set -e
set -o pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

TARGET=${PAAS_CI_ADDRESS:-https://concourse-ci.lospaaseros.com}
LOGIN=${PAAS_CI_LOGIN:-false}
PROJECT=${TARGET_PROJECT:-dummy-pipeline}

if [ "${PROJECT}" == "false" ]
then
    echo "You need to define a project to deploy via the param TARGET_PROJECT"
    exit 1
fi

if [ "${LOGIN}" == "true" ]; then
    fly -t lospaaseros login -k -c ${TARGET}
fi
fly -t lospaaseros set-pipeline \
    -c $PROJECT_DIR/concourse/dummy-pipeline.yml \
    -p ${PROJECT} \
    -l $PROJECT_DIR/.secrets/pipeline-vars.yml \
    -n
fly -t lospaaseros unpause-pipeline -p ${PROJECT}