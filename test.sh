#!/usr/bin/env bash

FILE=$1

if [ ! -f "$FILE" ]; then
    echo "File $FILE does not exist."
    exit 1
fi

if [ ! -x "$FILE" ]; then
    echo "File $FILE is not executable."
    exit 1 
fi

diff <($FILE ./examples/measurements.txt) ./examples/results.txt

if [ $? -ne 0 ]; then
    echo "Test ./examples/results.txt failed."
    exit 1
fi

diff <($FILE ./examples/measurements2.txt) ./examples/results2.txt

if [ $? -ne 0 ]; then
    echo "Test ./examples/results2.txt failed."
    exit 1
fi

diff <($FILE ./examples/measurements3.txt) ./examples/results3.txt

if [ $? -ne 0 ]; then
    echo "Test ./examples/results3.txt failed."
    exit 1
fi

echo "All tests passed." >&2
