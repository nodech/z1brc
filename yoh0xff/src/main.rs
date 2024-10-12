use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::process::exit;
use std::{env, fs::File};

struct Stats {
    min: f32,
    max: f32,
    avg: f32,
}

type CityStats = HashMap<String, Stats>;

type AvgDataMap = HashMap<String, (f32, u32)>;

type DataPoint = (String, f32);

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() <= 1 {
        println!("Please pass the file path as an argument");
        return;
    }

    let file_path: String = args[1].clone();
    let file = match File::open(file_path) {
        Ok(file) => file,
        Err(error) => {
            println!("Failed to read the file: {}", error);
            exit(1);
        }
    };

    let city_stats = process_file(&file);
    let mut sorted_cities: Vec<(&String, &Stats)> = city_stats.iter().collect();
    sorted_cities.sort_by_key(|&(key, _)| key);

    for (city, stats) in sorted_cities {
        println!("{};{:.2};{:.2};{:.2}", city, stats.min, stats.max, stats.avg);
    }
}

fn process_file(file: &File) -> CityStats {
    let mut city_stats: CityStats = HashMap::new();
    let mut avg_data_map: AvgDataMap = HashMap::new();

    let reader = BufReader::new(file);
    for try_line in reader.lines() {
        if let Err(error) = try_line {
            println!("Failed to read the line: {}", error);
            exit(1);
        }

        let content: String = try_line.unwrap();
        let (city, data) = process_line(&content);

        let stats = city_stats.entry(city.clone()).or_insert(Stats {
            min: 0.0,
            max: 0.0,
            avg: 0.0,
        });
        stats.min = data.min(stats.min);
        stats.max = data.max(stats.max);

        let avg_data = avg_data_map.entry(city.clone()).or_insert((0.0, 0));
        avg_data.0 = avg_data.0 + data;
        avg_data.1 = avg_data.1 + 1;
    }

    for (city, stats) in city_stats.iter_mut() {
        let (sum, count) = avg_data_map.get(city).unwrap_or(&(0.0, 0));
        stats.avg = ((*sum / *count as f32) * 100.0).round() / 100.0;
    }

    return city_stats;
}

fn process_line(line: &String) -> DataPoint {
    let chunks: Vec<&str> = line.split(";").collect();
    if chunks.len() != 2 {
        println!("Invalid line format, 'x;y' format is expected: {}", line);
        exit(1);
    }

    let city: String = String::from(chunks[0]);
    let try_data = chunks[1].parse();
    if let Err(error) = try_data {
        println!("Invalid number format: {}", error);
        exit(1);
    }
    let data: f32 = try_data.unwrap();

    return (city, data);
}
