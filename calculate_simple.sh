#!/usr/bin/env bash

FILE=$1

if [ ! -f $FILE ]; then
    echo "File $FILE does not exist."
fi

# Run the script with the following command:
node ./simple/simple.mjs $FILE
