#!/usr/bin/env bash

FILE=$1

if [ ! -f $FILE ]; then
    echo "File $FILE does not exist."
fi

# Run the script with the following command:
deno run -A --unstable-worker-options ./ez/ez-v1.ts $FILE
