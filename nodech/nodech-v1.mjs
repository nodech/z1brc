#!/usr/bin/env node

import fs from 'fs';

const measurementFile = process.argv[2];
const MAX_NAME_LENGTH = 50;

const CHUNK_SIZE = 1024;
// const CHUNK_SIZE = 1024 * 1024; // 1MB
const CHAR_SEMI = ';'.charCodeAt(0);
const CHAR_NL = '\n'.charCodeAt(0);

const STATE_NAME = 0;
const STATE_VALUE = 1;

const currentName = Buffer.alloc(MAX_NAME_LENGTH)
let currentNameLength = 0;
const currentNumber = Buffer.alloc(8);
let currentNumberLength = 0;

let state = STATE_NAME;

const map = new Map();

const readStream = fs.createReadStream(measurementFile, {
  highWaterMark: CHUNK_SIZE
});

for await (const chunk of readStream) {
  for (let i = 0; i < chunk.length; i ++) {
    switch (state) {
      case STATE_NAME: {
        if (chunk[i] === CHAR_SEMI) {
          state = STATE_VALUE;
          continue;
        }

        currentName[currentNameLength++] = chunk[i];
        break;
      }

      case STATE_VALUE: {
        if (chunk[i] === CHAR_NL) {
          state = STATE_NAME;

          // process final shit.
          const name = currentName.toString('utf8', 0, currentNameLength);
          const number = +currentNumber.slice(0, currentNumberLength).toString();
          currentNameLength = 0;
          currentNumberLength = 0;

          let existing = map.get(name);
          if (existing) {
            existing.count++;
            existing.sum += number;
            existing.min = existing.min > number ? number : existing.min;
            existing.max = existing.max < number ? number : existing.max;
          } else {
            map.set(name, {
              count: 1,
              sum: number,
              min: number,
              max: number
            });
          }

          continue;
        }

        currentNumber[currentNumberLength++] = chunk[i]
        break;
      }
    }
  }
}

const names = Array.from(map.keys()).sort();

for (const name of names) {
  const cityData = map.get(name);
  const avg = (cityData.sum / cityData.count).toFixed(2);
  console.log(`${name};${cityData.min.toFixed(2)};${cityData.max.toFixed(2)};${avg}`);
}
