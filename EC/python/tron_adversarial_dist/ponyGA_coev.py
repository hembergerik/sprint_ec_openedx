#! /usr/bin/env python

# The MIT License (MIT)

# Copyright (c) 2013 Erik Hemberg

# Permission is hereby granted, free of charge, to any person
# obtaining a copy of this software and associated documentation files
# (the "Software"), to deal in the Software without restriction,
# including without limitation the rights to use, copy, modify, merge,
# publish, distribute, sublicense, and/or sell copies of the Software,
# and to permit persons to whom the Software is furnished to do so,
# subject to the following conditions:

# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
# BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

#TODO avoid reversing when sorting for fitness maximization, do it prettier
#TODO run ai vs ai without drawing at all
#TODO insert code example sin some functions.
import random
import math
import copy
from tron_v2 import *
import string
import collections
import json
import database
import run_tron_coev
#import pony_ga

"""
PonyGA Coevolution

Object orient stuff for GA
Author Erik Hemberg

"""

class Tron_fitness_coev(ponyGA.Tron_fitness):
    """Evaluate fitnesses"""

    def __init__(self, rows=8, cols=8):
        """Constructor"""
        ponyGA.Tron_fitness.__init__(self, rows, cols)

    def __call__(self, individual_0, individual_1):
        """Function call operator. Starts a Tron game and sets the
        strategies of the two players according to the Individual
        function arguments. The fitness of the winner increases by 1.

        Keyword arguments:
        individual_0 -- Indivdual solution
        individual_1 -- Indivdual solution
        """
        print('TronNonAdversarialFitness.__call__', individual_0.fitness,
              individual_1.fitness)
        #Create Tron game instance
        tron_game = Tron(self.rows, self.cols)
        strategy_0 = self.decode_individual(individual_0, self.strategy_str)
        strategy_1 = self.decode_individual(individual_1, self.strategy_str)
        tron_game.canvas.players[0] = PlayerAI(x=self.rows/2, 
                                               y=self.cols/2, 
                                               direction=(0,1),
                                               color="Blue",
                                               alive=True,
                                               _id=0,
                                               ai=True,
                                               canvas=tron_game.canvas,
                                               strategy=strategy_0) 
      	tron_game.canvas.players[1] = PlayerAI(x=self.rows/2 + 1, 
                                               y=self.cols/2 + 1, 
                                               direction=(0,1),
                                               color="Green", 
                                               alive=True,
                                               _id=0,
                                               ai=True,
                                               canvas=tron_game.canvas, 
                                               strategy=strategy_1)
        winner = tron_game.run()
        if winner == 0:
            individual_0.fitness += 1
        elif winner is not None:
            individual_1.fitness += 1
        else:
            #TODO Why does it sometimes return None?
            print("GRR")
        print("TronNonAdversarialFitness.__call__ winner", winner, individual_0.fitness, individual_1.fitness)

class GA_coev(ponyGA.GA):
    """Genetic Algorithm which uses coevolution as a fitness function."""

    POPULATION_FILE = 'population.dat'
    JS_POPULATION_FILE = 'js_population.dat'
    DATABASE = None

    def __init__(self, POPULATION_SIZE, MAX_SIZE, DEFAULT_FITNESS, 
                 GENERATIONS, ELITE_SIZE, CROSSOVER_PROBABILITY, 
                 MUTATION_PROBABILITY, fitness_function):
        ponyGA.GA.__init__(POPULATION_SIZE, MAX_SIZE, DEFAULT_FITNESS, 
                 GENERATIONS, ELITE_SIZE, CROSSOVER_PROBABILITY, 
                 MUTATION_PROBABILITY, fitness_function)

    def serialize_population(self, individuals):
        """Write the individuals to file. Write the n-best to a
        separate file in js-format.

        Keyword arguments:
        individuals -- List of Individuals
        """
        f_out = open(GA_coev.POPULATION_FILE, 'w')
        js_out = open(GA_coev.JS_POPULATION_FILE, 'w')
        if Tron.DATABASE is not None:
            db = database.Database(Tron.DATABASE)
        for individual in individuals:
            f_out.write(individual.serialize())
            f_out.write('\n')
            if Tron.DATABASE is not None:
                db.store_ai_individual(individual)

        #Write as a string in JavaScript syntax
        js_out.write(Tron_fitness.js_str(individuals[0]))

        f_out.close()
        js_out.close()
        db.close()

    def evaluate_fitness(self, individuals, fitness_function):
        """Perform the coevolutionary fitness evaluation for each
        individual. Each individual competes against each other.

        Keyword arguments:
        individuals -- List of individuals
        fitness_function -- Fitness function to evaluate
        """
        for i, ind_0 in enumerate(individuals):
            cnt = min(i+1, len(individuals))
            for ind_1 in individuals[cnt:]:
                fitness_function(ind_0, ind_1)


if __name__ == '__main__':
    POPULATION_SIZE = 3
    MAX_SIZE = 15
    DEFAULT_FITNESS = 10000
    GENERATIONS = 1
    ELITE_SIZE = 1
    #WARNING SEED is hardcoded. Change the SEED for different search
    SEED = 4
    CROSSOVER_PROBABILITY = 0.9
    MUTATION_PROBABILITY = 0.5
    #TODO command line arguments
    
    random.seed(SEED)
    
#    fitness_function = TronNonAdversarialFitness(32, 10)
    fitness_function = Tron_fitness_coev(4, 4)
    ga_coev = GA_coev(POPULATION_SIZE, MAX_SIZE, DEFAULT_FITNESS, 
                      GENERATIONS, ELITE_SIZE, CROSSOVER_PROBABILITY, 
                      MUTATION_PROBABILITY, fitness_function)
    ga_coev.run()
