use std::collections::HashMap;
use std::io::{self, BufRead, BufReader, Read, Seek, SeekFrom};
use std::process::exit;
use std::thread::{available_parallelism, spawn};
use std::{env, fs::File};

#[derive(Debug)]
struct Stats {
    min: f64,
    max: f64,
    avg: (f64, i64),
}
type CityStats = HashMap<String, Stats>;

type DataPoint = (String, f64);

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() <= 1 {
        println!("Please pass the file path as an argument");
        return;
    }

    let file_path: String = args[1].clone();
    let city_stats = match execute(&file_path) {
        Ok(result) => result,
        Err(error) => {
            println!("Execution failed: {}", error);
            exit(1);
        }
    };

    let mut sorted_cities: Vec<(&String, &Stats)> = city_stats.iter().collect();
    sorted_cities.sort_by_key(|&(key, _)| key);

    for (city, stats) in sorted_cities {
        println!(
            "{};{:.2};{:.2};{:.2}",
            city,
            stats.min,
            stats.max,
            stats.avg.0 / stats.avg.1 as f64
        );
    }
}

/*******************************************************************************************************************
 * Execution functions
 */
fn execute(file_path: &String) -> Result<CityStats, io::Error> {
    let offsets = calc_file_offsets(file_path)?;
    let mut interim_results = vec![];

    let cpu_cores = query_cpu_cores();

    // if page_size < 1000 {
    //     execute_in_single_thread(file_path);
    // } else {
    //     execute_in_multi_threads(file_path);
    // }

    let mut handles = vec![];
    for i in 0..cpu_cores {
        let file_path_copy = file_path.clone();
        let offsets_copy = offsets.clone();

        let handle = spawn(move || process_file_chunk(&file_path_copy, offsets_copy[i]));

        handles.push(handle);
    }

    for handle in handles {
        let interim_result = handle.join().unwrap()?;
        interim_results.push(interim_result);
    }

    let final_result = merge_interim_results(&interim_results);
    Ok(final_result)
}

/*******************************************************************************************************************
 * Data processing functions
 */
fn process_file_chunk(file_path: &String, offset: (u64, u64)) -> Result<CityStats, io::Error> {
    let mut city_interim_stats: CityStats = HashMap::new();
    let mut total_bytes: u64 = 0;
    let (start, end) = offset;

    let file = File::open(file_path)?;
    let mut reader = BufReader::new(file);
    reader.seek(SeekFrom::Start(start))?;

    for try_line in reader.lines() {
        let content = try_line?;

        total_bytes += content.len() as u64 + 1;

        let (city, data) = process_line(&content)?;

        let stats = city_interim_stats.entry(city.clone()).or_insert(Stats {
            min: data,
            max: data,
            avg: (0.0, 0),
        });
        stats.min = data.min(stats.min);
        stats.max = data.max(stats.max);
        stats.avg.0 += data;
        stats.avg.1 += 1;

        if total_bytes >= (end - start) {
            break;
        }
    }

    Ok(city_interim_stats)
}

fn process_line(line: &String) -> Result<DataPoint, io::Error> {
    let chunks: Vec<&str> = line.split(";").collect();

    if chunks.len() != 2 {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("Invalid line format, 'x;y' format is expected: {}", line),
        ));
    }

    let city: String = String::from(chunks[0]);
    let data: f64 = match chunks[1].parse() {
        Ok(result) => result,
        Err(error) => {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                format!("Invalid number format: {}", error),
            ));
        }
    };

    Ok((city, data))
}

/*******************************************************************************************************************
 * Utility functions
 */
fn merge_interim_results(interim_results: &Vec<CityStats>) -> CityStats {
    let accumulated_interim_result =
        interim_results
            .into_iter()
            .fold(CityStats::new(), |mut acc, interim_result| {
                for (city, stats) in interim_result.iter() {
                    let entry = acc.entry(city.clone()).or_insert(Stats {
                        min: stats.min,
                        max: stats.max,
                        avg: (0.0, 0),
                    });

                    entry.min = entry.min.min(stats.min);
                    entry.max = entry.max.max(stats.max);
                    entry.avg.0 += stats.avg.0;
                    entry.avg.1 += stats.avg.1;
                }
                acc
            });

    accumulated_interim_result
}

fn calc_file_offsets(file_path: &String) -> Result<Vec<(u64, u64)>, io::Error> {
    let mut offsets = vec![];

    let file = File::open(file_path)?;
    let file_size = file.metadata()?.len();
    let cpu_cores = query_cpu_cores();
    let chunk_size = file_size / cpu_cores as u64;

    let mut reader = BufReader::new(file);
    let mut start = 0;
    for c in 0..cpu_cores {
        let mut end: u64 = (c + 1) as u64 * chunk_size;

        reader.seek(SeekFrom::Start(end))?;
        let mut buffer = [0; 100];
        let n = reader.read(&mut buffer)?;
        if n == 0 {
            continue;
        }
        // We try to find new line in next 100 characters
        for i in 0..n {
            if buffer[i] == b'\n' {
                break;
            }

            end += 1;
        }

        offsets.push((start, end));
        start = end + 1;
    }

    return Ok(offsets);
}

fn query_cpu_cores() -> usize {
    let cpu_cores = available_parallelism().map(|x| x.get()).unwrap_or(1);
    return cpu_cores;
}