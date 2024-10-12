#!/usr/bin/env node

/**
 * Call this script: ./gen.mjs <output> <lines> <names>
 *
 * Generate random file for the test.
 *
 * Format of each line: Name;Temperature
 * Name - ascii (a-zA-Z0-9), 1-50 characters
 * Temperature - float, -100.00 to 100.00 with 2 decimal places
 */

import fs from 'fs';

const OUTPUT = process.argv[2];
const LINES = (+process.argv[3]) || 1_000;
const NAMES = (+process.argv[4]) || 100;

if (!OUTPUT) {
  console.log(`Usage: ./gen.mjs <output> <lines> <names>`);
  process.exit(1);
}

// Just naive implementation
let cityCounter = 0;

const names = Array.from({ length: NAMES }, () => `city-${(cityCounter++).toString().padStart(2, '0')}`);
const getRandCity = () => names[Math.floor(Math.random() * NAMES)];
const getRandTemp = () => (Math.random() * 200 - 100).toFixed(2);

const writeStream = fs.createWriteStream(OUTPUT);

for (let i = 0; i < LINES; i++)
  writeStream.write(`${getRandCity()};${getRandTemp()}\n`);
