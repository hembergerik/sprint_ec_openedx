#!/usr/bin/env python
# -*- coding: UTF-8 -*-


import cgi
import cgitb
import database
import random
import json
import tron_v3
import copy
import math
import database
import threading

def tron_evaluate_AIs(AI_1, AI_2):
    tron_game = tron_v3.Tron(20, AI_1['genome'], AI_2['genome'])
    result = tron_game.run()

    #return 1 if AI2 wins, returns 0 if AI1 wins
    AI_1['fitness'] += AI_1['fitness'] - result + 1
    AI_2['fitness'] += result
    

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
    }

    terminals = []
    functions = []

    for key in arity.keys():
        if (arity[key] == 0):
            terminals.append(key)
        else:
            functions.append(key)

    return {'arity': arity, 'terminals': terminals, 'functions': functions}

symbols = get_symbols()

DEFAULT_FITNESS = 0

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
        new_node = symbol
    else:
        new_node = [symbol]
    node.append(new_node)
    return new_node
    
def copy_tree(tree):
    return copy.deepcopy(tree)
    
def get_node_at_index(root, idx):
    unvisited_nodes = [root]
    node = root
    cnt = 0
    while (cnt <= idx and len(unvisited_nodes) > 0):
        node = unvisited_nodes.pop()
        if (type(node) is not str):
            i=len(node)-1
            while i > 0:
                unvisited_nodes.append(node[i])
                i-=1
        else:
            unvisited_nodes.append(node)
        cnt += 1
    return node    
    
def grow(tree, depth, max_depth, full, symbols):
    if (type(tree) is not str):
        symbol = tree[0]
    else:
        symbol = tree
    i = 0
    while (i < symbols["arity"][symbol]):
        new_symbol = get_random_symbol(depth, max_depth, symbols, full)
        new_node = append_symbol(tree, new_symbol, symbols)
        new_depth = depth + 1
        if (new_symbol in symbols['functions']):
            grow(new_node, new_depth, max_depth, full, symbols)
        i += 1
    
def find_and_replace_subtree(root, subtree, node_idx, idx):
    """
    Returns the current index and replaces the root with another subtree at the
    given index. The index is based on depth-first left-to-right traversal.
    """
    if type(subtree)==str:
        subtree='\"'+subtree+'\"'
    else:
        subtree=repr(subtree)
    return changeItem(root,node_idx + 1,subtree)
    
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
    cnt = cnt + 1
    if (type(root) is not str):
        i=1
        cnt -= 1
        for tree in root:
            cnt = get_number_of_nodes(tree, cnt)
    return cnt

def get_depth_from_index(node, tree_info, node_idx, depth):
    if (node_idx == tree_info["idx"]):
        tree_info["idx_depth"] = depth
    tree_info["idx"] = tree_info["idx"] + 1
    i=1
    while i < len(node):
        depth = depth + 1
        tree_info = get_depth_from_index(node[i], tree_info, node_idx, depth)
        depth = depth - 1
        i+=1
    return tree_info

def replace_subtree(new_subtree, old_subtree):
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
        old_subtree = new_subtree
        
# returns the index of the nth instance of a character in a string (1-indexed)
def findNth(string,char,n):
    current=string.find(char)
    while current>=0 and n>1:
        current=string.find(char,current+1)
        n-=1
    return current

# changes the nth element in listOfLists to changeTo (n is 1-indexed)
# AN EXTRA SET OF QUOTES MUST BE PLACED AROUND changeTo
def changeItem(listOfLists,n,changeTo):
    stringForm=repr(listOfLists)
    if n==1:
        startOfSection=0
    else:
        startOfSection=findNth(stringForm,',',n-1)+1
    endOfSection=findNth(stringForm,',',n)
    stringSection=stringForm[startOfSection:endOfSection]
    outputString=stringForm[:startOfSection]
    replaced=False
    for char in stringSection:
        if char in '[] ':
            outputString+=char
        else:
            if replaced:
                continue
            replaced=True
            outputString+=str(changeTo)
    outputString+=stringForm[endOfSection:]
    return eval(outputString)

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
        # Number of individual solutions
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
        self.population = []

    def initialize_population(self):
        """Initializes a Tron AI population
        """
        self.population = []
        i = 0
        while(i < self.population_size):
            full = random.randint(0,1)
            max_depth = (i % self.max_size) + 1
            symbol = get_random_symbol(1, max_depth, symbols, full)
            tree = [symbol]
            if (max_depth > 0 and symbol in symbols["functions"]):
                grow(tree, 1, max_depth, full, symbols)
            self.population.append({'genome': tree, 'fitness': DEFAULT_FITNESS})
            print i
            print json.dumps(self.population[i]['genome'])
            i += 1
        return self.population
        
        
        
    #TOOD: READ POPULATION FROM DB


    def search_loop(self, new_individuals):
        """
        Return the best individual from the evolutionary search
        loop. Starting from the initial population.
        Updates the population after evolution.

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
            new_individuals.sort(lambda x,y: y['fitness'] - x['fitness'])
            best_ever = new_individuals[0]
            # Replace population
            individuals = self.generational_replacement(new_individuals,
                                                        individuals)
            self.print_stats(generation, individuals)
            self.population = new_individuals
            generation += 1
            # Selection
            parents = self.tournament_selection()
            # Create new population
            new_individuals = []
            #TODO crossover does the copying of the individuals, is this too
            # implicit?
            while len(new_individuals) < self.population_size:
                cross=random.sample(parents, 2)
                # Vary the population by crossover
                new_individuals.extend(
                    # Pick 2 parents and pass them into crossover.
                    # '*' means that the list is collapsed
                    self.onepoint_crossover(cross[0], cross[1])
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
        individuals.sort(lambda x,y: y['fitness'] - x['fitness'])
        # Get the fitness values
        fitness_values = [i['fitness'] for i in individuals]
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
            competitors.sort(lambda x,y: y['fitness'] - x['fitness'])
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
        old_population.sort(lambda x,y: y['fitness'] - x['fitness'])
        # Append a copy of the best solutions of the old population to
        # the new population. ELITE_SIZE are taken
        for ind in old_population[:self.elite_size]:
            new_population.append(copy.deepcopy(ind))
        # Sort the new population
        new_population.sort(lambda x,y: y['fitness'] - x['fitness'])
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
        for individual in individuals:
            individual['fitness'] = 0
        i = 0 
        if len(individuals) % 2 == 1:
            individuals.append({'genome': ['TURN_LEFT'], 'fitness': DEFAULT_FITNESS})
        best_individuals = individuals[:]
        
        
        while len(best_individuals) > 2:
            fitnesses = [j['fitness'] for j in individuals]
            max_fitness = max(fitnesses)
            def fitness_compare(individual):
                if individual['fitness'] == max_fitness:
                    return individual
            best_individuals = filter(fitness_compare, best_individuals)
            best_individuals.sort(lambda x,y: y['fitness'] - x['fitness'])
            if len(best_individuals) % 2 == 1:
                best_individuals.pop()
            i = 0
            while i < len(best_individuals):
                fitness_function(best_individuals[i], best_individuals[i+1])
                i += 2


    def mutation(self, individual):
        if (random.random() < self.mutation_probability):
            end_node_idx = get_number_of_nodes(individual["genome"], 0) - 1
            node_idx =random.randint(0, end_node_idx)
            node_info = get_depth_from_index(individual["genome"], {'idx_depth': 0, 'idx': 0}, node_idx, 0)
            max_subtree_depth = self.max_size - node_info['idx_depth']
            new_subtree = [get_random_symbol(max_subtree_depth, self.max_size, symbols,False)]
            if (new_subtree[0] in symbols['functions']):
                full = False
                grow(new_subtree, node_info['idx_depth'], self.max_size, full, symbols)
            individual['genome'] = find_and_replace_subtree(individual["genome"], new_subtree, node_idx, -1)
        return individual
    
    def onepoint_crossover(self, parent_0, parent_1):
        children = []
        genome_0=copy_tree(parent_0["genome"])
        child_0 = {'genome': genome_0,'fitness': DEFAULT_FITNESS}
        children.append(child_0)
        genome_1=copy_tree(parent_1["genome"])
        child_1 = {'genome': genome_1,'fitness': DEFAULT_FITNESS}
        children.append(child_1)
        if (random.random() < self.crossover_probability):
            xo_nodes = []
            for j in range(2):
                end_node_idx = get_number_of_nodes(children[j]["genome"], 0) - 1
                node_idx = random.randint(0, end_node_idx)
                xo_nodes.append(get_node_at_index(children[j]["genome"], node_idx))
            tmp_child_1_node = copy_tree(xo_nodes[1])
            replace_subtree(xo_nodes[0], xo_nodes[1])
            replace_subtree(tmp_child_1_node, xo_nodes[0])
        return children

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
    
    def run_from_population(self, population):
        self.population = population
        best_ever=self.search_loop(population)
        return best_ever
            


#enables debugging by web.
print "Content-Type: text/plain;charset=utf-8"
print 
print "Hello World!"


t=Tron_GA_v3(1000,4,5,250,0.6,0.6,tron_evaluate_AIs)
#t.run()
#t.initialize_population()
db = database.Database('tron.db')
#db.replace_population(t.population)
print 'initial potato', db.get_population()

def run_tron_coev():
    db = database.Database('tron.db')
    t.run_from_population(db.get_population())
    print 'fitness', t.population[0]['fitness']
    db.replace_population(t.population)
    
    #recursive set-timeout loops again woooooo
    timer = threading.Timer(20, run_tron_coev)
    timer.start()
    #print 'potatoes', i, t.population
    
run_tron_coev()

