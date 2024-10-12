#!/usr/bin/env bash

FILE=$1
BATCH_SIZE=1000000

if [ ! -f $FILE ]; then
    echo "File $FILE does not exist."
fi

# Run the script with the following command:
deno run -A --unstable-worker-options ./ez/mod.ts $FILE $BATCH_SIZE
