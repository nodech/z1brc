1BRC
====

Input file format:
```
Name;temperature
Name;temperature
Name;temperature
```

Name: 1-50 characters, a-zA-Z0-9-
Temperature: -100.00 to 100.00 with 2 decimal places

Example from [./samples/measurements.txt](./samples/measurements.txt):
```
city-05;74.48
city-84;23.69
city-98;26.96
city-29;-19.58
city-87;-39.29
city-74;55.94
city-62;29.42
city-07;-7.10
city-84;-56.33
city-67;-37.29
...
```

Output is sorted alphabetically. Format:
```
AName;min;max;avg
BName;min;max;avg
...
```
