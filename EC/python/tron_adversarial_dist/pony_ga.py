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


"""
Evolutionary Algorithm for **STU Tron ALFA** non-adversarial.

The source code design is for teaching the concept of how evolution
inspires computational intelligence, not for fast portable use.

.. codeauthor:: Erik Hemberg <hembergerik@csail.mit.edu>

**STU Tron ALFA** Evolutionary Algorithm Description
----------------------------------------------------

Components
~~~~~~~~~~

**Individual**
  The individual solutions.

**TronNonAdversarialFitness**
  The fitness function. 

  - Decodes an individual
  - Evaluates the individual on **STU Tron** and assigns it a fitness score

**GA** 
  The evolutionary algorithm, performs a *stochastic parallel
  iterative* search. The algorithm:

  - Generate a population of *initial solutions*
  - *Iterate* a fixed number of times 

    - *Select* solutions for a new population
    - *Vary* the solutions in the new population
  
      - *Mutate* a solution
      - *Crossover* two solutions

    - *Evaluate* the fitness of the new solutions
    - *Replace* the old population with the new population

Running **STU Tron ALFA EA**
----------------------------

::

  usage: pony_ga.py [-h] [-p PSIZE] [-m MAXSIZE] [-e ESIZE] [-g GENERATIONS] [-s SEED]
                  [-cp CROSSOVER] [-mp MUTATION] [-r ROWS] [-d]

  optional arguments:
    -h, --help            show this help message and exit
    -p PSIZE, --psize PSIZE
                          population size
    -m MAXSIZE, --maxsize MAXSIZE
                          individual size
    -e ESIZE, --esize ESIZE
                          elite size
    -g GENERATIONS, --generations GENERATIONS
                          number of generations
    -s SEED, --seed SEED  seed number
    -cp CROSSOVER, --crossover CROSSOVER
                          crossover probability
    -mp MUTATION, --mutation MUTATION
                          mutation probability
    -r ROWS, --rows ROWS  # of board rows
    -d, --draw_board      draw the board or not

"""

import random
import math
import copy

import argparse

from tron_non_adversarial import Tron


class Individual(object):
    """
    A GA Individual.

    Attributes:
      - Genome -- The code defining the strategy of the individual.
        I.e. the input which is decoded and evaluated by the fitness function
      - Fitness -- The fitness value of the individual

    DEFAULT_FITNESS
      Default fitness value of an unevaluated individual

    """

    DEFAULT_FITNESS = -1000

    def __init__(self, genome):
        """
        Constructor

        

        :param genome: genome of the individual
        :type genome: list of integers
        """
        # Individual solution genome is an integer array
        self.genome = genome
        # Individual solution fitness. Starts with a default fitness
        # value
        self.fitness = Individual.DEFAULT_FITNESS

    def __lt__(self, other):
        """
        Returns the comparison of fitness values between two individuals.

        :param other: other individual to compare against
        :type other: Individual
        """
        return self.fitness < other.fitness

    def __str__(self):
        """
        Returns a string representation of fitness and genome
        """
        _str = 'Individual: %f, %s' % (float(self.fitness), self.genome)
        return _str

    def serialize(self):
        """
        Return a string with fitness and genome. Used when
        serializing the individual solution.
        """
        _str = '%f; %s' % (float(self.fitness), self.genome)
        return _str

    def deserialize(self, _str):
        """
        Parses a string and sets the fitness and genome fields. The
        counter part of serialize.

        

        :param _str: string to parse
        :type _str: string
        """
        # Strip whitespace from the string and split the string on ';'
        splits = _str.strip().split(';')
        # Fitness is the first token of the split
        self.fitness = float(splits[0])
        # Strip the token of whitespace and split on ',' Ignore the start
        # '[' and end ']'
        splits = splits[1].strip()[1:-1].split(',')
        # Set the genome
        self.genome = []
        # Iterate over the tokens and set the genome.
        for _split in splits:
            self.genome.append(int(_split))


class TronNonAdversarialFitness(object):
    """
    .. _tron_non_adversarial_fitness:

    **STU Tron ALFA** non-adversarial fitness function. Evaluates an
    individual and assigns it its fitness.

    Attributes:
      - Rows -- The number of rows on the **STU Tron** board
      - Bike Width -- Width of the bike in the **STU Tron** game
      - Draw board -- Indicates if the **STU Tron** GUI should be used
      - Strategy template -- Strategy template used :ref:`example of encoding a strategy <encoding_ex>`
      - Strategy -- The decoded strategy
    """

    def __init__(self, rows, draw_board, max_size):
        """
        Constructor

        :param rows: Number of rows on the **STU Tron** board
        :type rows: integer
        :param draw_board: Display GUI
        :type draw_board: integer
        :param max_size: the maximum size of a solution
        :type max_size: integer
        """
        # Rows in tron game
        self.rows = rows
        # Bike width in tron game
        self.bike_width = 4
        # Display the board or not. The evaluation is significantly
        # faster if the board is not displayed
        self.draw_board = draw_board

        # String format representation of valid python syntax that
        # will be evaluated as the strategy. The individual bitstring
        # is decoded into a string. The string is evaluated in the STU
        # Tron game. 

        # In triple-quoted strings, unescaped newlines and quotes are
        # allowed (and are retained), except that three unescaped
        # quotes in a row terminate the string. (From
        # http://docs.python.org/2/reference/lexical_analysis.html )
        self.strategy_template = \
            '''
if self.is_obstacle_in_relative_direction(%d):
    %s
elif self.is_obstacle_in_relative_direction(%d):
    %s
elif self.is_obstacle_in_relative_direction(%d):
    %s
else:
    %s
'''
        self.decision_tree_body_depth = TronNonAdversarialFitness\
            .get_decision_tree_body_depth(max_size)

        self.strategy_template = \
            TronNonAdversarialFitness\
            .create_strategy_template(self.decision_tree_body_depth)

        self.strategy = None

    @classmethod
    def get_decision_tree_body_depth(cls, max_size):
        """
        Return the depth of the decision list body
        :param max_size: number of bits encoding the decision list
        :type max_size: integer
        :return: depth of the decision list body
        :rtype: integer
        """

        assert max_size % 2 == 0
        # Number of bits used for head and foot of decision list. I.e.
        # minimum number of bits needed for the decision list. There are 3
        # variables, each requiring 2 bits.
        depth = max_size - (3 * 2)
        # Number of variables from each depth level of the decision list
        depth = depth / 2
        # Number of bits used to encode each variable of the decision list
        depth = depth / 2
        assert depth >= 0
        return depth

    @classmethod
    def create_strategy_template(cls, depth):
        """
        Return the template strategy string given a depth. The depth
        determines the size of the template.

        :param depth: depth of decision list body
        :type depth: integer
        :return: decision list template
        :rtype: str
        """
        strategy_template_head = \
            '''if self.is_obstacle_in_relative_direction(%d):
    %s
'''
        strategy_template_body = \
            '''elif self.is_obstacle_in_relative_direction(%d):
    %s
'''
        strategy_template_foot = \
            '''else:
    %s
'''
        strategy_template = strategy_template_head

        for _ in range(depth):
            strategy_template += strategy_template_body

        strategy_template += strategy_template_foot

        print(strategy_template)
        return strategy_template

    def __call__(self, individual_0):
        """
        Function call operator. Starts a Tron game and sets the
        strategy of the player according to the Individual
        function arguments. The fitness is the length of the tail.

        :param individual_0: Individual solution
        :type individual_0: Individual
        """
        # Decode the individual to get the tron strategy from the
        # bitstring representation
        self.strategy = self.decode_individual(individual_0)
        # Create Tron game instance
        tron_game = Tron(rows=self.rows, bike_width=self.bike_width,
                         draw_board=self.draw_board, strategy=self.strategy)
        # Run the tron game
        tron_game.run()
        # Set the fitness of the individual solution as the length of
        # the bike trail
        individual_0.fitness = len(tron_game.player.bike_trail)
        print("TronNonAdversarialFitness.__call__ fitness:%d" % individual_0.fitness)

    def decode_individual(self, individual):
        """
        Returns a strategy which is decoded from the genome of an individual

        :param individual: Individual that is decoded
        :type individual: Individual

        """

        def get_slice_boundary(_start, _step):
            """ Return the start and end intervals given a step."""
            return _start, _start + _step

        # The strategy code template is filled in when decoding the
        # individual solution. The genome of the individual is used to
        # select the values in the strategy. 
        strategy_decoder = []
        step = 2
        start, end = get_slice_boundary(0, step)
            #Is obstacle in the direction, use 2 bits
        strategy_decoder.append(TronNonAdversarialFitness.get_direction(
                TronNonAdversarialFitness.bitstring_to_int(individual.genome[
                                                           start:end])))
        start, end = get_slice_boundary(end, step)
            #Action, use 2 bits
        strategy_decoder.append(TronNonAdversarialFitness.get_action_string(
                TronNonAdversarialFitness.bitstring_to_int(individual.genome[
                                                           start:end])))
        start, end = get_slice_boundary(end, step)
        for _ in range(self.decision_tree_body_depth):
            #Is obstacle in the direction, use 2 bits
            strategy_decoder.append(TronNonAdversarialFitness.get_direction(
                TronNonAdversarialFitness.bitstring_to_int(individual.genome[
                                                           start:end])))
            start, end = get_slice_boundary(end, step)
            #Action, use 2 bits
            strategy_decoder.append(TronNonAdversarialFitness
                                    .get_action_string(
                TronNonAdversarialFitness.bitstring_to_int(individual.genome[
                                                           start:end])))
            start, end = get_slice_boundary(end, step)

            #Action, use 2 bits
        strategy_decoder.append(TronNonAdversarialFitness.get_action_string(
                TronNonAdversarialFitness.bitstring_to_int(individual.genome[
                                                           start:end])))

        strategy = self.strategy_template % tuple(strategy_decoder)
        print('decode_individual', strategy)
        return strategy

    @classmethod
    def bitstring_to_int(cls, bitstring):
        """
        Return the base 10 integer value of the bitstring
        
        
        :param bitstring: bitstring
        :type bitstring: list of integers
        :returns: base 10 value
        :rtype: integer
        """
        return int(''.join(map(str, bitstring)), base=2)

    @classmethod
    def get_action_string(cls, action):
        """
        Return an action as a string.

        
        :param action:
        :type action: integer
        :returns: Action, a call to a function which changes the direction
        :rtype: string
        """

        # There is a bias towards ahead whe 2 bits are used
        if action == 0:
            return "self.left()"
        elif action == 1:
            return "self.right()"
        else:
            return "self.ahead()"

    @classmethod
    def get_direction(cls, direction):
        """
        Return a direction index change [-1, 0, 1, 2]. Based on current
        direction index and translated in
        :ref:`PLAYER_DIRECTIONS <player_directions>` indices

        - 0, ahead
        - -1, left 90 degrees
        - 1, right 90 degrees
        - 2, 180 degrees

        :param direction: Direction
        :type direction: integer
        :returns: Index change for the direction array
        :rtype: integer
        """
        if direction == 0:
            return 0
        elif direction == 1:
            return 1
        elif direction == 2:
            return -1
        elif direction == 3:
            return 2


class GA(object):
    """
    Genetic Algorithm. An implementation of an :ref:`Evolutionary Algorithm
    <evolutionary_algorithm>` #TODO how much duplicate EA description?

    Attributes:

    - Population size -- Size of the population
    - Solution size -- Size of the bitstring which represents an individual
      solution
    - Generations -- Number of iterations of the search loop
    - Elite size -- Number of individuals preserved between generations
    - Crossover probability -- Probability of crossing over two solutions
    - Mutation probability -- Probability of mutating a solution
    - Fitness function -- Method used to evaluate fitness, e.g.
      :ref:`**STU Tron ALFA** non-adversarial <tron_non_adversarial_fitness>`

    POPULATION_FILE
      File where population is saved
    """

    POPULATION_FILE = 'ga_population.dat'

    def __init__(self, population_size, max_size, generations, elite_size, crossover_probability, mutation_probability,
                 fitness_function):
        """Constructor

        

        :param population_size: Size of population
        :type population_size: integer
        :param max_size: Bitstring size for an individual solution
        :type max_size: integer
        :param generations: Number of iterations of the search loop
        :type generations: integer
        :param elite_size: Number of individuals preserved between generations
        :type elite_size: integer
        :param crossover_probability: Probability of crossing over two solutions
        :type crossover_probability: float
        :param mutation_probability: Probability of mutating a solution
        :type mutation_probability: float
        :param fitness_function: Method used to evaluate fitness of a solution
        :type fitness_function: Object
        """
        # Population size is the number of individual solutions
        self.population_size = population_size
        # Size of the individual solution
        self.max_size = max_size
        # Number of iterations of the search loop
        self.generations = generations
        # Number of individual solutions that are preserved between
        # generations
        self.elite_size = elite_size
        # Probability of crossover
        self.crossover_probability = crossover_probability
        # Probability of mutation
        self.mutation_probability = mutation_probability
        # Function that is used to evaluate the fitness of the
        # individual solution
        self.fitness_function = fitness_function

    def initialize_population(self):
        """
        Return a list of individuals. An individual is a uniformly
        random bitstring.

        

        :returns: List of individuals, the population
        :rtype: List of Individuals
        """

        individuals = []
        for i in range(self.population_size):
            genome = [random.randint(0, 1) for _ in range(self.max_size)]
            individuals.append(Individual(genome))
            print('Initial %d: %s' % (i, genome))

        return individuals

    @classmethod
    def serialize_population(cls, individuals):
        """
        Write the individuals to file.

        

        :param individuals: Individuals to serialize
        :type individuals: List of Individuals
        """
        f_out = open(GA.POPULATION_FILE, 'w')
        for individual in individuals:
            f_out.write(individual.serialize())
            f_out.write('\n')

        f_out.close()

    def search_loop(self, new_individuals):
        """
        Return the best individual from the evolutionary search
        loop. Starting from the initial population.

        

        :param new_individuals: Initial population of individuals
        :type new_individuals: List of Individual
        :returns: Best individual
        :rtype: Individual
        """

        #Initalise first generation
        individuals = []
        best_ever = None
        #Generation loop
        generation = 0
        while generation < self.generations:
            # Evaluate fitness
            self.evaluate_fitness(new_individuals, self.fitness_function)
            # Find best solution by sorting the population
            new_individuals.sort(reverse=True)
            best_ever = new_individuals[0]
            # Replace population
            individuals = self.generational_replacement(new_individuals,
                                                        individuals)
            # Print the stats of the population
            self.print_stats(generation, individuals)
            # Write population to file
            self.serialize_population(individuals)
            # Increase the generation counter
            generation += 1
            # Selection
            parents = self.tournament_selection(individuals)
            # Create new population
            new_individuals = []
            #TODO crossover does the copying of the individuals, is this too
            # implicit?
            while len(new_individuals) < self.population_size:
                # Vary the population by crossover
                new_individuals.extend(
                    # Pick 2 parents and pass them into crossover.
                    # '*' means that the list is collapsed
                    self.onepoint_crossover(*random.sample(parents, 2))
                )

            # Select population size individuals. Handles uneven population
            # sizes, since crossover returns 2 offspring
            new_individuals = new_individuals[:self.population_size]
            # Vary the population by mutation
            new_individuals = list(map(self.mutation, new_individuals))

        return best_ever

    def print_stats(self, generation, individuals):
        """
        Print the statistics for the generation and individuals.
       
        :param generation:generation number
        :type generation: integer
        :param individuals: population to get statistics for
        :type individuals: list of individuals
        """

        def get_ave_and_std(values):
            """
            Return average and standard deviation.            

            :param values: Values to calculate on
            :type values: list of numbers
            :returns: Average and Standard deviation of the input values
            :rtype: Tuple of floats
            """
            _ave = float(sum(values)) / len(values)
            _std = math.sqrt(float(
                sum((value - _ave) ** 2 for value in values)) / len(values))
            return _ave, _std

        # Sort individuals
        individuals.sort(reverse=True)
        # Get the fitness values
        fitness_values = [i.fitness for i in individuals]
        # Calculate average and standard deviation of the fitness in
        # the population
        ave_fit, std_fit = get_ave_and_std(fitness_values)
        # Print the statistics, including the best solution
        print("Gen:%d evals:%d fit_ave:%.2f+-%.3f %s" %
              (generation, (self.population_size * generation),
               ave_fit, std_fit,
               individuals[0]))

    def tournament_selection(self, population, tournament_size=2):
        """
        Return individuals from a population by drawing
        `tournament_size` competitors randomly and selecting the best
        of the competitors. `population_size` number of tournaments are
        held.

        :param population: Population to select from
        :type population: list of individuals
        :param tournament_size: Size of a tournament
        :type tournament_size: integer
        :returns: selected individuals
        :rtype: list of individuals
        """

        # Iterate until there are enough tournament winners selected
        winners = []
        while len(winners) < self.population_size:
            # Randomly select tournament size individual solutions
            # from the population.
            competitors = random.sample(population, tournament_size)
            # Rank the selected solutions
            competitors.sort(reverse=True)
            # Append the best solution to the winners
            winners.append(competitors[0])

        return winners

    def generational_replacement(self, new_population, old_population):
        """
        Return new a population. The `elite_size` best old_population
        are appended to the new population. They are kept in the new
        population if they are better than the worst.

        :param new_population: the new population
        :type new_population: list of old_population
        :param old_population: the old population
        :type old_population: list of old_population
        :returns: the new population with the best from the old population
        :rtype: list of old_population
        """

        # Sort the population
        old_population.sort(reverse=True)
        # Append a copy of the best solutions of the old population to
        # the new population. ELITE_SIZE are taken
        for ind in old_population[:self.elite_size]:
            new_population.append(copy.deepcopy(ind))
        # Sort the new population
        new_population.sort(reverse=True)
        # Set the new population size
        return new_population[:self.population_size]

    @classmethod
    def evaluate_fitness(cls, individuals, fitness_function):
        """
        Perform the fitness evaluation for each
        individual.

        :param individuals: Population to evaluate
        :type individuals: List of individuals
        :param fitness_function: Fitness function to evaluate the population on
        :type fitness_function: Object
        """
        # Iterate over all the individual solutions
        for ind in individuals:
            # Execute the builtin '__call__' method of the fitness
            # function
            fitness_function(ind)

    def mutation(self, individual):
        """
        Return an new individual which has a random point bit(point in
        the genome) picked and flipped.

        :param individual: individual to mutate
        :type individual: Individual
        :returns: The mutated individual
        :rtype: individual
        """
        # Check if the individual will be mutated
        if random.random() < self.mutation_probability:
            #Pick gene
            idx = random.randint(0, len(individual.genome) - 1)
            #Flip it
            individual.genome[idx] = (individual.genome[idx] + 1) % 2

        return individual

    def onepoint_crossover(self, parent_0, parent_1):
        """
        Return a list of two new individuals that given two
        individuals, create two children using one-point crossover.

        :param parent_0: Parent one
        :type parent_0: Individual
        :param parent_1: Parent two
        :type parent_1: Individual
        :returns: Two children from the parents
        :rtype: List of individuals
        """
        # Get the genomes from the parents
        genome_parent_0, genome_parent_1 = parent_0.genome, parent_1.genome
        # Uniformly generate crossover points. 
        pt_p = random.randint(1, self.max_size)
        # Make new chromosomes by crossover.
        if random.random() < self.crossover_probability:
            child_0 = genome_parent_0[:pt_p] + genome_parent_1[pt_p:]
            child_1 = genome_parent_1[:pt_p] + genome_parent_0[pt_p:]
        else:
            child_0, child_1 = genome_parent_0[:], genome_parent_1[:]
        # Put the new chromosomes into new individuals
        return [Individual(child_0), Individual(child_1)]

    def run(self):
        """
        Return the best solution. Create an initial
        population. Perform an evolutionary search.

        :returns: Best solution
        :rtype: Individual
        """

        #Create population
        individuals = self.initialize_population()
        # Start evolutionary search
        best_ever = self.search_loop(individuals)

        return best_ever


def main():
    """
    Parse the command line arguments. Create the **STU Tron** fitness
    function and the Genetic Algorithm. Run the
    search.

    :return: Best individual
    :rtype: Individual
    """
    # Parse arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("-p", "--psize", type=int, default=10,
                        help="population size")
    parser.add_argument("-m", "--maxsize", type=int, default=22,
                        help="individual size")
    parser.add_argument("-e", "--esize", type=int, default=1, help="elite size")
    parser.add_argument("-g", "--generations", type=int, default=5,
                        help="number of generations")
    parser.add_argument("-s", "--seed", type=int, default=None,
                        help="seed number")
    parser.add_argument("-cp", "--crossover", type=float, default=0.9,
                        help="crossover probability")
    parser.add_argument("-mp", "--mutation", type=float, default=0.8,
                        help="mutation probability")
    parser.add_argument("-r", "--rows", type=int, default=10,
                        help="# of board rows")
    parser.add_argument("-d", "--draw_board", action='store_true',
                        help="draw the board or not")
    args = parser.parse_args()
    # Set arguments
    population_size = args.psize
    max_size = args.maxsize
    generations = args.generations
    elite_size = args.esize
    seed = args.seed
    crossover_probability = args.crossover
    mutation_probability = args.mutation
    rows = args.rows
    draw_board = False#args.draw_board

    # Set random seed for reproducibility
    if seed is not None:
        random.seed(seed)

    fitness_function = TronNonAdversarialFitness(rows, draw_board, max_size)
    pony_ga = GA(population_size, max_size, generations, elite_size, crossover_probability,
                 mutation_probability, fitness_function)

    return pony_ga.run()


if __name__ == '__main__':
    main()
