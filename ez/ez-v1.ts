import { isMainThread } from "node:worker_threads";

if (isMainThread) {
  const INPUT = Deno.args[0];
  const BATCH_SIZE = +Deno.args[1];
  const WORKER_MODE = !!BATCH_SIZE;

  // const startedAt = performance.now();

  // read file
  const data = await Deno.readTextFile(INPUT);
  const lines = data.split("\n");

  // calculate the number of batches
  const workerCount = Math.ceil(lines.length / BATCH_SIZE);

  const ctx: Context = {
    finishedWorkerCount: 0,
    workerCount,
    finalResult: new Map(),
  };

  // run workers per batch
  if (WORKER_MODE) {
    for (let i = 0; i < workerCount; i++) {
      runWorker(lines.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE), ctx);
    }
  } else {
    const cities = analyse(lines);
    showOutput(cities);
  }
} else {
  self.onmessage = (e) => {
    //   const { filename } = e.data;
    const data = e.data;

    //   const data = Deno.readTextFileSync(filename);

    const cities = analyse(data);

    self.postMessage(cities);

    self.close();
  };
}

function analyse(data: string[]) {
  const cities = new Map();

  for (const line of data) {
    if (!line) continue;

    const [city, temp] = line.split(";");
    const temperature = +temp;

    if (!cities.has(city)) {
      cities.set(city, {
        min: temperature,
        max: temperature,
        sum: 0,
        count: 0,
      });
    }

    const cityData = cities.get(city);
    cityData.min = Math.min(cityData.min, temperature);
    cityData.max = Math.max(cityData.max, temperature);
    cityData.sum += temperature;
    cityData.count++;
  }

  return cities;
}

function runWorker(data: string[], ctx: Context) {
  const worker = new Worker(
    new URL(import.meta.filename!, import.meta.url).href,
    {
      type: "module",
      deno: {
        permissions: { read: true },
      },
    }
  );

  // start
  worker.postMessage(data);

  // result callback
  worker.addEventListener("message", (e) => {
    ctx.finishedWorkerCount++;
    // console.log("finished", finishedWorkerCount, workerCount);

    // merge results
    mergeResults(ctx.finalResult, e.data);

    // console.log("finished", ctx.finishedWorkerCount, ctx.workerCount, ctx.finalResult.size);

    if (ctx.finishedWorkerCount === ctx.workerCount) {
      showOutput(ctx.finalResult);
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
    console.log(
      `${name};${cityData.min.toFixed(2)};${cityData.max.toFixed(2)};${avg}`
    );
  }
  // const duration = performance.now() - startedAt;

  // console.log({ cities });
}

type Context = {
  workerCount: number;
  finishedWorkerCount: number;
  finalResult: any;
};
type Value = {
  min: number;
  max: number;
  sum: number;
  count: number;
};
