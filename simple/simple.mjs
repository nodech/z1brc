#!/usr/bin/env node

/**
 * Call this script: ./solve_simple.mjs <input>
 *
 * Does not work on big files.
 * Calculate min, max and average temperature for each city.
 */

import fs from 'fs';

const INPUT = process.argv[2];

const cities = new Map();
const data = fs.readFileSync(INPUT, 'utf-8');

for await (const line of data.split('\n')) {
  if (!line) continue;

  const [city, temp] = line.split(';');
  const temperature = +temp;

  if (!cities.has(city)) {
    cities.set(city, {
      min: temperature,
      max: temperature,
      sum: 0,
      count: 0
    });
  }

  const cityData = cities.get(city);
  cityData.min = Math.min(cityData.min, temperature);
  cityData.max = Math.max(cityData.max, temperature);
  cityData.sum += temperature;
  cityData.count++;
}

const names = Array.from(cities.keys()).sort();

for (const name of names) {
  const cityData = cities.get(name);
  const avg = (cityData.sum / cityData.count).toFixed(2);
  console.log(`${name};${cityData.min.toFixed(2)};${cityData.max.toFixed(2)};${avg}`);
}
