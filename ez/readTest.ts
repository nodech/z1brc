import fs from "node:fs";
import readline from "node:readline";

async function processLineByLine() {
  const fileStream = fs.createReadStream("examples/measurements3.txt");

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  let c = 0;

  for await (const line of rl) {
    // Each line in input.txt will be successively available here as `line`.
    // console.log(`Line from file: ${line}`);
    // c++
  }

  return c;
}

// let startedAt = performance.now();
// const res = await processLineByLine();
// const duration = performance.now() - startedAt;

// console.log(duration, res);

const t = Deno.readTextFileSync("examples/measurements3.txt");

{
  const startedAt = performance.now();
  let lines = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "\n") {
      lines++;
    }
  }

  const duration = performance.now() - startedAt;
  console.log(duration, lines);
}

{
  const startedAt = performance.now();
  let lines = t.split("\n").length;
  const duration = performance.now() - startedAt;
  console.log(duration, lines);
}
