package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
	"sync"
)

func check(e error) {
	if e != nil {
		panic(e)
	}
}

type CityInfo struct {
	min   float64
	max   float64
	total float64
	count int64
}

func processLine(line string, temperatures map[string]CityInfo) {
	line = strings.ReplaceAll(line, "\n", "")
	parts := strings.Split(line, ";")
	city := parts[0]
	number, err := strconv.ParseFloat(parts[1], 64)
	check(err)

	value, exists := temperatures[city]
	if !exists {
		temperatures[city] = CityInfo{
			min:   number,
			max:   number,
			count: 1,
			total: number,
		}
	} else {
		value.max = max(value.max, number)
		value.min = min(value.min, number)
		value.total += number
		value.count += 1
		temperatures[city] = value
	}
}

func findNearestDelimiter(file *os.File, pos int64, forward bool) int64 {
	// Buffer to read one character at a time
	buffer := make([]byte, 1)
	for {
		_, err := file.Read(buffer)
		if err != nil {
			break // End of file or error
		}
		if buffer[0] == '\n' {
			return pos
		}
		if forward {
			pos++
		} else {
			pos--
			file.Seek(pos, 0) // Move file pointer back by 1
		}
	}
	return pos // Return the position, even if no `;` found
}

func mergeMaps(mapA map[string]CityInfo, mapB map[string]CityInfo) map[string]CityInfo {
	resultMap := make(map[string]CityInfo)
	for key, valueA := range mapA {
		valueB, exists := mapB[key]
		if !exists {
			resultMap[key] = valueA
		} else {
			resultMap[key] = CityInfo{
				min:   min(valueA.min, valueB.min),
				max:   max(valueA.max, valueB.max),
				total: valueA.total + valueB.total,
				count: valueA.count + valueB.count,
			}
		}

	}
	for key, valueB := range mapB {
		_, exists := mapA[key]
		if !exists {
			resultMap[key] = valueB
		}
	}

	return resultMap
}

func processFileChunk(filePath string, start int64, end int64, wg *sync.WaitGroup, results chan map[string]CityInfo) {
	defer wg.Done()
	file, err := os.Open(filePath)
	check(err)
	defer file.Close()

	file.Seek(start, 0)

	reader := bufio.NewReader(file)

	var bytesRead int64
	temperatures := make(map[string]CityInfo)
	for bytesRead < (end - start) {
		line, err := reader.ReadString('\n') // Read lines up to a newline
		check(err)
		bytesRead += int64(len(line))
		processLine(line, temperatures)
	}
	results <- temperatures

}

func main() {

	// Get file path
	filePath := os.Args[1]

	// Open file
	file, err := os.Open(filePath)
	check(err)
	defer file.Close()

	// Get the file size
	fileInfo, err := file.Stat()
	check(err)
	fileSize := fileInfo.Size()

	go_routines_count := 8
	fileChunkSize := fileSize / int64(go_routines_count)

	var wg sync.WaitGroup
	results := make(chan map[string]CityInfo, go_routines_count)

	for k := 0; k < go_routines_count; k++ {
		start := int64(k) * fileChunkSize
		end := int64(k+1) * fileChunkSize
		if k == go_routines_count-1 {
			end = fileSize
		}
		if k != 0 {
			file.Seek(start, 0)
			start = findNearestDelimiter(file, start, true) + 1
		}

		// Find the nearest ';' to end
		file.Seek(end, 0)
		end = findNearestDelimiter(file, end, true)

		wg.Add(1)
		go processFileChunk(filePath, start, end, &wg, results)
	}

	wg.Wait()
	close(results)

	finalResults := make(map[string]CityInfo)
	for resultMap := range results {
		finalResults = mergeMaps(resultMap, finalResults)
	}

	var keys []string
	for key := range finalResults {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	for _, key := range keys {
		value := finalResults[key]
		fmt.Printf("%s;%.2f;%.2f;%.2f\n", key, value.min, value.max, value.total/float64(value.count))
	}

}
