1BRC
====

### Setup
  - Create `prepare_{name}.sh` - where you can install pre-requisite things on ubuntu machine?
  - Create `calculate_{name}.sh` - which will call your program. First arg will be file:
    - `./calculate_{name}.sh measurements.txt`
  - Create `{name}` directory and your file in it.

### Input file format
 - Name: 1-50 characters, a-zA-Z0-9-
 - Temperature: -100.00 to 100.00 with 2 decimal places

File:
```
Name;temperature
Name;temperature
Name;temperature
```

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

### Output format

Output must go to the stdout.
Output is sorted alphabetically. Format:
```
AName;min;max;avg
BName;min;max;avg
...
```

### Running tests

Tests use examples folder.

To check your solution works:
`./test.sh calculate_{name}.sh`
