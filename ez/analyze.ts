export const analyse = (data: string[])=>{
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

    return cities
}