#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import { cpus } from 'os';

const __filename = fileURLToPath(import.meta.url);
const measurementFile = process.argv[2];
const BUFFER_SIZE = 1024 * 1024;

const MAX_NAME_LENGTH = 50;
const CHAR_SEMI = ';'.charCodeAt(0);
const CHAR_NL = '\n'.charCodeAt(0);
const CHAR_DOT = '.'.charCodeAt(0);
const CHAR_MINUS = '-'.charCodeAt(0);

const STATE_NAME = 0;
const STATE_VALUE = 1;

if (isMainThread) {
  await mainThread();
} else {
  await workerThread();
}

async function mainThread() {
  const stat = fs.statSync(measurementFile);

  let cpuCount = cpus().length;
  const splitSize = Math.ceil(stat.size / cpuCount);
  const fd = await fs.promises.open(measurementFile, 'r');
  const readBuffer = Buffer.alloc(60); // should be big enough to find line.
  const points = [];

  if (stat.size / BUFFER_SIZE < cpuCount) {
    cpuCount = Math.ceil(stat.size / BUFFER_SIZE);
  }

  // find new lines in the file.
  let prev = 0;
  for (let i = 1; i < cpuCount + 1; i++) {
    const end = Math.min(i * splitSize, stat.size);

    await fd.read(readBuffer, 0, readBuffer.length, end);
    const nlindex = readBuffer.indexOf('\n');
    points.push({
      start: prev,
      end: end + nlindex
    });

    prev = end + nlindex + 1;
  }

  await fd.close();


  const workers = [];
  for (let i = 0; i < cpuCount; i++) {
    workers.push(runMeasurementWorker(__filename, `worker-${i}`, {
      file: measurementFile,
      start: points[i].start,
      end: points[i].end
    }));
  }

  const results = await Promise.all(workers)
  
  const reduced = results.reduce((acc, [map]) => {
    for (const [key, value] of map.entries()) {
      const existing = acc.get(key);

      if (existing) {
        existing.count += value.count;
        existing.sum += value.sum;
        existing.min = existing.min > value.min ? value.min : existing.min;
        existing.max = existing.max < value.max ? value.max : existing.max;
      } else {
        acc.set(key, value);
      }
    }

    return acc;
  }, new Map());

  const names = Array.from(reduced.keys()).sort();

  for (const name of names) {
    const cityData = reduced.get(name);
    const avg = (cityData.sum / cityData.count).toFixed(2);
    console.log(`${name};${cityData.min.toFixed(2)};${cityData.max.toFixed(2)};${avg}`);
  }
}

async function workerThread() {
  // const readBuffer = Buffer.alloc(BUFFER_SIZE);
  const readBuffers = [
    Buffer.alloc(BUFFER_SIZE),
    Buffer.alloc(BUFFER_SIZE)
  ]

  const { file, start, end } = workerData;
  const fd = await fs.promises.open(file, 'r');

  const map = new Map();
  const currentName = Buffer.alloc(MAX_NAME_LENGTH)
  let currentNameLength = 0;
  const currentNumber = Buffer.alloc(8);
  let currentNumberLength = 0;
  let state = STATE_NAME;

  let readPromise = fd.read(readBuffers[0], 0, BUFFER_SIZE, start);
  let bufferCounter = 0;
  let tip = start;

  while (true) {
    let nextStart = tip + BUFFER_SIZE;

    const currentBuffer = readBuffers[bufferCounter % 2];
    bufferCounter++;
    const nextBuffer = readBuffers[bufferCounter % 2];
    const { bytesRead } = await readPromise;

    if (nextStart < end) {
      const readSize = Math.min(BUFFER_SIZE, end - nextStart + 1);
      readPromise = fd.read(nextBuffer, 0, readSize, nextStart);
    }

    if (bytesRead === 0) {
      break;
    }

    for (let i = 0; i < bytesRead; i ++) {
      switch (state) {
        case STATE_NAME: {
          if (currentBuffer[i] === CHAR_SEMI) {
            state = STATE_VALUE;
            continue;
          }

          currentName[currentNameLength++] = currentBuffer[i];
          break;
        }

        case STATE_VALUE: {
          if (currentBuffer[i] === CHAR_NL) {
            state = STATE_NAME;

            // process final shit.
            const name = currentName.toString('utf8', 0, currentNameLength);
            // const temp = +currentNumber.slice(0, currentNumberLength).toString();
            const temp = buffer2intfloat(currentNumber, currentNumberLength);
            currentNameLength = 0;
            currentNumberLength = 0;

            let existing = map.get(name);
            if (existing) {
              existing.count++;
              existing.sum += temp;
              existing.min = existing.min > temp ? temp : existing.min;
              existing.max = existing.max < temp ? temp : existing.max;
            } else {
              map.set(name, {
                count: 1,
                sum: temp,
                min: temp,
                max: temp
              });
            }

            continue;
          }

          currentNumber[currentNumberLength++] = currentBuffer[i]
          break;
        }
      }
    }

    tip += BUFFER_SIZE;

    if (nextStart > end) {
      break;
    }
  }

  parentPort.postMessage(map);

  await fd.close();
}

function runMeasurementWorker(filename, name, workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(filename, { workerData, name });
    const messages = [];

    worker.on('message', (message) => {
      messages.push(message);
    });

    worker.on('error', (error) => {
      reject(error);
    });

    worker.on('exit', (code) => {
      if (code === 0) {
        resolve(messages);
      } else {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

function buffer2intfloat(buffer, length) {
  let number = 0;

  let pow = 1;
  for (let i = length - 1; i >= 0; i--) {
    if (buffer[i] === CHAR_DOT) {
      continue;
    }

    if (buffer[i] === CHAR_MINUS) {
      number = -number;
      continue;
    }

    number = number + (buffer[i] - 48) * pow;
    pow *= 10;
  }

  return number / 100;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
