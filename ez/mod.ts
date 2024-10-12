import { analyse } from "./analyze.ts";

const INPUT = Deno.args[0];
const BATCH_SIZE = +Deno.args[1];
const WORKER_MODE = !!BATCH_SIZE

const startedAt = performance.now();

// read file
const data = Deno.readTextFileSync(INPUT);
const lines = data.split("\n");

// calculate the number of batches
const workerCount = Math.ceil(lines.length / BATCH_SIZE);
let finishedWorkerCount = 0;
const finalResult = new Map();

// run workers per batch
if (WORKER_MODE) {
  for (let i = 0; i < workerCount; i++) {
    runWorker(lines.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE));
  }
} else {
  const cities = analyse(lines);
  showOutput(cities);
}

function runWorker(data: string[]) {
  const worker = new Worker(new URL("./worker.ts", import.meta.url).href, {
    type: "module",
    deno: {
      permissions: { read: true },
    },
  });

  // start
  worker.postMessage(data);

  // result callback
  worker.addEventListener("message", (e) => {
    finishedWorkerCount++;
    // console.log("finished", finishedWorkerCount, workerCount);

    // merge results
    mergeResults(finalResult, e.data);

    // console.log("finished", finishedWorkerCount, workerCount, finalResult.size);

    if (finishedWorkerCount === workerCount) {
      showOutput(finalResult);
    }
  });
}

function mergeResults(a: Map<string, Value>, b: Map<string, Value>) {
  b.forEach((x, key) => {
    const originalValue = a.get(key);

    a.set(key, {
      min: Math.min(originalValue?.count ?? Number.MAX_VALUE, x.min),
      max: Math.max(originalValue?.count ?? Number.MIN_VALUE, x.max),
      count: originalValue?.count ?? 0 + x.count,
      sum: originalValue?.sum ?? 0 + x.sum,
    });
  });

  return a;
}

function showOutput(cities: Map<any, any>) {
  const names = Array.from(cities.keys()).sort();

  for (const name of names) {
    const cityData = cities.get(name);
    const avg = (cityData.sum / cityData.count).toFixed(2);
    console.log(`${name};${cityData.min.toFixed(2)};${cityData.max.toFixed(2)};${avg}`);
  }

//   const duration = performance.now() - startedAt;

//   console.log({ WORKER_MODE, workerCount, duration });
}

type Value = {
  min: number;
  max: number;
  sum: number;
  count: number;
};
