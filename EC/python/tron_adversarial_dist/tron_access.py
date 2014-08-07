#! /usr/bin python

import tron
import tron_ea
import ponyGP_coev
import random


HEADER = '''
<html>
<head>
<title>Tron Game Stats</title>
</head>
<body>
<table>
<tr>
<th>Time</th><th>Winner</th><th>Loser</th>
</tr>
'''
FOOTER = '''
</table>
</body>
</html>
'''

def print_results():
    stats = {}
    stats_file = open(tron.Bike.STATS_FILE, 'r')
    for line in stats_file:
        _split = line.split(',')
        stats[_split[0]] = (_split[1], 
                            _split[2])

    stats_file.close()

    results_file = "tron_game_stats.html"
    f_out = open(results_file, 'w')
    f_out.write(HEADER)
    for key, value in stats.items():
        f_out.write('<tr>')
        f_out.write('<td>%s</td>' % key)
        for _value in value:
            f_out.write('<td>%s</td>' % _value)
        f_out.write('</tr>')

    f_out.write(FOOTER)
    f_out.close()

def get_random_ai():
    population = tron_ea.read_population(symbols, ponyGA_coev.GA_coev.POPULATION_FILE)
    individual = random.sample(population, 1)[0]
    return individual

def main():
    #Get AI
    ai = get_random_ai()
    print("main() Random AI:", str(ai))
    #Play game
    tron_game = tron.Tron(ROWS, COLS)
    tron_game.canvas.bikes[1] = tron.Bike_AI(ROWS/2 + 1, COLS/2 + 1, 
                                             "Green", tron_game.canvas, 0, 1, 
                                             ai.genome.root)
    tron_game.run()

    #Show results
    print_results()

if __name__ == '__main__':
    ROWS = 8
    COLS = 8

    main()
