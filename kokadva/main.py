import sys


def parse_line(line):
    city, temp = line.split(';')
    temp = float(temp)
    return city, temp


def main():
    temps = {}
    file_path = sys.argv[1]
    with open(file_path, 'r') as f:
        for line in f:
            city, temp = parse_line(line)
            if city not in temps:
                temps[city] = {
                    'min': temp,
                    'max': temp,
                    'total': 0,
                    'avg': 0,
                    'count': 0
                }
            temps[city]['min'] = min(temps[city]['min'], temp)
            temps[city]['max'] = max(temps[city]['max'], temp)
            temps[city]['total'] = temps[city]['total'] + temp
            temps[city]['count'] = temps[city]['count'] + 1
            temps[city]['avg'] = temps[city]['total'] / temps[city]['count']
    cities = list(sorted(list(temps.keys())))

    for city in cities:
        _min = round(temps[city]['min'], 2)
        _max = round(temps[city]['max'], 2)
        _avg = round(temps[city]['avg'], 2)
        res = f'{city};{_min};{_max};{_avg}'
        print(res)


if __name__ == '__main__':
    main()
