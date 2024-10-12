import { analyse } from "./analyze.ts";

self.onmessage = (e) => {
  //   const { filename } = e.data;
  const data = e.data;

  //   const data = Deno.readTextFileSync(filename);

  const cities = analyse(data);

  self.postMessage(cities);

  self.close();
};
