#!/usr/bin/env python
# -*- coding: UTF-8 -*-


import cgi
import cgitb
import database
import random
import json
import tron_v3
import math

def tron_evaluate_AIs(AI_1, AI_2):
    tron_game = tron_v3.Tron(20, AI_1['genome'], AI_2['genome'])
    result = tron_game.run()
    #return 1 if AI2 wins, returns 0 if AI1 wins
    AI_1['fitness'] = AI_1['fitness'] - result + 0.1
    AI_2['fitness'] += float(result)/10
    

def get_symbols():
    arity = {
        "TURN_LEFT": 0,
        "TURN_RIGHT": 0,
        "SENSE_A": 0,
        "SENSE_L": 0,
        "SENSE_R": 0,
        "0.1": 0,
        "0.3": 0,
        "0.6": 0,
        "+": 2,
        "-": 2,
        "IFLEQ": 4
    };

    terminals = [];
    functions = [];

    for key in arity.keys():
        if (arity[key] == 0):
            terminals.append(key)
        else:
            functions.append(key)

    return {'arity': arity, 'terminals': terminals, 'functions': functions}

symbols = get_symbols();

DEFAULT_FITNESS = 0;

#returns a random symbol
#@param depth: current depth in tree
#@param max_depth: maximum depth
#@param symbols: total possible symbols
#@param full: whether the tree is full or not
def get_random_symbol(depth, max_depth, symbols, full):
    if (depth >= (max_depth - 1)):
        symbol = symbols["terminals"][random.randint(0, len(symbols["terminals"])-1)]
    else:
        terminal = get_random_boolean()
        if (not full and terminal):
            symbol = symbols["terminals"][random.randint(0, len(symbols["terminals"])-1)]
        else:
            symbol = symbols["functions"][random.randint(0, len(symbols["functions"])-1)]
    return symbol

def get_random_boolean():
    return random.random() < 0.5

#Adds a symbol to a node
#@param the tree to add the symbol to
#@param symbol: the symbol
#@param symbols: the collection of symbols, used to test if the symbol is terminal/functional.
def append_symbol(node, symbol, symbols):
    if symbol in symbols['terminals']:
        new_node = symbol;
    else:
        new_node = [symbol];
    node.append(new_node);
    return new_node
    
    
def append_symbol(node, symbol, symbols):
    if symbol in symbols['terminals']:
        new_node = symbol
    else:
        new_node = [symbol]
    node.append(new_node)
    return new_node

    
    
def grow(tree, depth, max_depth, full, symbols):
    if (type(tree) is not str):
        symbol = tree[0];
    else:
        symbol = tree;
    i = 0
    while (i < symbols["arity"][symbol]):
        new_symbol = get_random_symbol(depth, max_depth, symbols, full);
        new_node = append_symbol(tree, new_symbol, symbols);
        new_depth = depth + 1;
        if (new_symbol in symbols['functions']):
            grow(new_node, new_depth, max_depth, full, symbols)
        i += 1
    '''   
    def find_and_replace_subtree(root, subtree, node_idx, idx):
    idx = idx + 1;
    if (node_idx == idx):
        print 'root', root
        replace_subtree(subtree, root);
    else:
        for child in root[1:]:
            print 'child', child
            print type(child)
            idx = find_and_replace_subtree(child, subtree, node_idx, idx)
    return idx;
    '''
def find_and_replace_subtree(root, subtree, node_idx, idx):
    """
    Returns the current index and replaces the root with another subtree at the
    given index. The index is based on depth-first left-to-right traversal.

    :param root: Root of the tree
    :type root: list
    :param subtree: Subtree that will replace the root
    :type subtree: list
    :param node_idx: Index of the node to be replaced
    :type node_idx: int
    :param idx: Current index
    :type idx: int
    :return: Current index
    :rtype: int
    """

    # Increase the index
    print 'idx', idx
    idx += 1
    # Check if index is a the given node
    if node_idx == idx:
        print 'root', root
        if type(root) == str:
            print 'replacing', subtree
            root = subtree
            print subtree
        else:
            replace_subtree(subtree, root);
    elif type(root) == list:
        # Iterate over the children
        for child in get_children(root):
            print 'child', child
            # Recursively travers the child
            idx = find_and_replace_subtree(child, subtree, node_idx, idx)
    return idx
    


#convert a node_idx to a list of indexes that point to the index.
def find_subtree_index(subtree,node_idx, count, result):
    for sub_subtree in subtree:
        c

        
    
    
    
    
    
def get_children(node):
    """
    Return the children of the node. The children are all the elements of the
    except the first
    :param node: The node
    :type node: list
    :return: The children of the node
    :rtype: list
    """
    # Take a slice of the list except the head
    return node[1:]
    
    
        
def get_number_of_nodes(root, cnt):
    cnt = cnt + 1;
    if (type(root) is not str):
        i=1
        while (i < len(root)):
            cnt = get_number_of_nodes(root[i], cnt)
            i+=1
    return cnt

def get_depth_from_index(node, tree_info, node_idx, depth):
    if (node_idx == tree_info["idx"]):
        tree_info["idx_depth"] = depth
    tree_info["idx"] = tree_info["idx"] + 1
    i=1
    while i < len(node):
        depth = depth + 1;
        tree_info = get_depth_from_index(node[i], tree_info, node_idx, depth)
        depth = depth - 1
        i+=1
    return tree_info

def replace_subtree(new_subtree, old_subtree):
    print 'old', old_subtree, 'new', new_subtree
    if (type(old_subtree) is not str):
        del old_subtree[:]
        #http://stackoverflow.com/questions/1400608/how-to-empty-a-list-in-python
        if (type(new_subtree) is str):
            old_subtree.append(new_subtree)
        else:
            i=0
            while (i < len(new_subtree)):
                old_subtree.append(new_subtree[i])
                i+=1
    else:
        old_subtree = new_subtree;
        
def changeItem(listOfLists,element,changeTo):
  stringForm=repr(listOfLists)
  

class Tron_GA_v3(object):
    
    """
    TODO:
        READ DATABASE
        EVOLVE INDIVIDUALS FROM TRON GAME
        SAVE TO DATABASE
        NOT CLOG UP THREADS.
    
    
    
    """


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
        """//Initializes a Tron AI population
        //@param population_size size of total # of AI's
        //@param max_size Max Depth of AI's"""
        self.population = []
        i = 0
        while(i < self.population_size):
            full = random.randint(0,1)
            max_depth = (i % self.max_size) + 1;
            symbol = get_random_symbol(1, max_depth, symbols, full);
            tree = [symbol];
            if (max_depth > 0 and symbol in symbols["functions"]):
                grow(tree, 1, max_depth, full, symbols);
            self.population.append({'genome': tree, 'fitness': DEFAULT_FITNESS})
            print i
            print json.dumps(self.population[i]['genome'])
            i += 1
        return self.population;
        
        
        
    #TOOD: READ POPULATION FROM DB


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


    def tournament_selection(self,tournament_size=2):
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
            competitors = random.sample(self.population, tournament_size)
            # Rank the selected solutions
            competitors.sort(lambda x,y: x.fitness - y.fitness)
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
    def evaluate_fitness(self,individuals, fitness_function):
        """
        Perform the fitness evaluation for each
        individual.

        :param individuals: Population to evaluate
        :type individuals: List of individuals
        :param fitness_function: Fitness function to evaluate the population on
        :type fitness_function: Object
        """
        # Iterate over all the individual solutions
        i =0 
        if len(individuals) % 2 == 1:
            individuals.append({'genome': ['TURN_LEFT'], 'fitness': DEFAULT_FITNESS})
        while i < len(individuals):
            fitness_function(individuals[i], individuals[i+1])
            print individuals[i]['fitness'], individuals[i+1]['fitness']
            i += 2

#WHAT IS GET_DEPTH_FROM_INDEX, WHAT IS FIND_AND_REPLACE_SUBTREE       
    def mutation(self,mutation_probability, individual):
        if (random.random() < mutation_probability):
            end_node_idx = get_number_of_nodes(individual["genome"], 0) - 1;
            print 'end index,' 
            print end_node_idx
            node_idx =random.randint(0, end_node_idx);
            node_info = get_depth_from_index(individual["genome"], {'idx_depth': 0, 'idx': 0}, node_idx, 0);
            max_subtree_depth = self.max_size - node_info['idx_depth'];
            new_subtree = [get_random_symbol(max_subtree_depth, self.max_size, symbols,False)]
            print new_subtree
            print node_idx
            if (new_subtree[0] in symbols['functions']):
                full = False
                grow(new_subtree, node_info['idx_depth'], self.max_size, full, symbols)
            find_and_replace_subtree(individual["genome"], new_subtree, node_idx, -1)


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







print "Content-Type: text/plain;charset=utf-8"
print 
print "Hello World!"


t=Tron_GA_v3(10,4,10,10,0,0,1)
t.run()
t.initialize_population()
t.evaluate_fitness(t.population, tron_evaluate_AIs)
print t.population[2]
t.mutation(1,t.population[2])
print t.population[2]
