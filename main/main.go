package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strconv"
	"strings"
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

func main() {

	filePath := os.Args[1]

	file, err := os.Open(filePath)
	check(err)
	defer file.Close()

	scanner := bufio.NewScanner(file)

	temperatures := make(map[string]CityInfo)

	for scanner.Scan() {
		line := scanner.Text()
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

	var keys []string
	for key := range temperatures {
		keys = append(keys, key)
	}

	sort.Strings(keys)

	for _, key := range keys {
		value := temperatures[key]
		fmt.Printf("%s;%.2f;%.2f;%.2f\n", key, value.min, value.max, value.total/float64(value.count))
	}
}
