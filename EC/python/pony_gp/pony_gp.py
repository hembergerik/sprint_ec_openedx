#! /usr/env python

# The MIT License (MIT)

# Copyright (c) 2013, 2014 Erik Hemberg

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
import csv
import optparse

import random
import math
import copy

"""

Implementation of Genetic Programming(GP), the purpose of this code is
to describe how the algorithm works and the intended use is for teaching.
The design is supposed to be simple and self contained.
See oop_pony_gp for slightly more complex functions and object
orientation.


Genetic Programming
===================


An individual is a dictionary with two keys:

  - *genome* -- A tree
  - *fitness* -- The fitness of the evaluated tree

The fitness is maximized.

The nodes in a GP tree consists of different symbols. The symbols are either
functions (internal nodes with arity > 0) or terminals (leaf nodes with arity
= 0) The symbols is represented as a dictionary with the keys:

  - *arities* -- A dictionary where a key is a symbol and the value is the arity
  - *terminals* -- A list of strings(symbols) with arity 0
  - *functions* -- A list of strings(symbols) with arity > 0

Fitness Function
----------------

Find a symbolic expression (function) which yields the lowest error
for a given set of inputs.

Inputs have explanatory variables that have a corresponding
output. The input data is split into test and training data. The
training data is used to generate symbolic expressions and the test
data is used to evaluate the out-of-sample performance of the
evaluated expressions.


Pony GP Parameters
------------------

The parameters for Pony GP are in a dictionary.


.. codeauthor:: Erik Hemberg <hembergerik@csail.mit.edu>

"""
DEFAULT_FITNESS = -1000


def append_node(node, symbol):
    """
    Return the appended node. Append a symbol to the node.

    :param node: The node that will be appended to
    :type node: list
    :param symbol: The symbol that is appended
    :type symbol: str
    :return: The new node
    :rtype: list
    """

    # Create a list with the symbol and append it to the node
    new_node = [symbol]
    node.append(new_node)
    return new_node


def grow(node, depth, max_depth, full, symbols):
    """
    Recursively grow a node to max depth in a pre-order, i.e. depth-first
    left-to-right traversal.

    :param node: Root node of subtree
    :type node: list
    :param depth: Current tree depth
    :type depth: int
    :param max_depth: Maximum tree depth
    :type max_depth: int
    :param full: grows the tree to max depth when true
    :type full: bool
    :param symbols: set of symbols to chose from
    :type symbols: dict
    """

    # grow is called recursively in the loop. The loop iterates arity number
    # of times. The arity is given by the node symbol
    node_symbol = node[0]
    for i in range(symbols["arities"][node_symbol]):
        # Get a random symbol
        symbol = get_random_symbol(depth, max_depth, symbols, full)
        # Create a child node and append it to the tree
        new_node = append_node(node, symbol)
        # Call grow with the child node as the current node
        grow(new_node, depth + 1, max_depth, full, symbols)


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
    """
    Return the number of nodes in the tree. A recursive depth-first
    left-to-right search is done

    :param root: Root of tree
    :type root: list
    :param cnt: Current number of nodes in the tree
    :type cnt: int
    :return: Number of nodes in the tree
    :rtype: int

    """

    # Increase the count
    cnt += 1
    # Iterate over the children
    for child in get_children(root):
        # Recursively count the child nodes
        cnt = get_number_of_nodes(child, cnt)

    return cnt


def get_node_at_index(root, idx):
    """
    Return the node in the tree at a given index. The index is
    according to a depth-first left-to-right ordering.

    :param root: Root of tree
    :type root: list
    :param idx: Index of node to find
    :type idx: int
    :return: Node at the given index (based on depth-first left-to-right
      indexing)
    :rtype: list
    """

    # Stack of unvisited nodes
    unvisited_nodes = [root]
    # Initial node is the same as the root
    node = root
    # Set the current index
    cnt = 0
    # Iterate over the tree until the index is reached
    while cnt <= idx and unvisited_nodes:
        # Take an unvisited node from the stack
        node = unvisited_nodes.pop()
        # Add the children of the node to the stack
        # Get the children
        children = get_children(node)
        # Reverse the children before appending them to the stack
        children.reverse()
        # Add children to the stack
        unvisited_nodes.extend(children)

        # Increase the current index
        cnt += 1

    return node


def get_max_tree_depth(node, depth, max_depth):
    """
    Return the max depth of the tree. Recursively traverse the tree

    :param node: Root of the tree
    :type node: list
    :param depth: Current tree depth
    :type depth: int
    :param max_depth: Maximum depth of the tree
    :type max_depth: int
    :return: Maximum depth of the tree
    :rtype: int
    """

    # Update the max depth if the current depth is greater
    if max_depth < depth:
        max_depth = depth

    # Traverse the children of the root node
    for child in get_children(node):
        # Increase the depth
        depth += 1
        # Recursively get the depth of the child node
        max_depth = get_max_tree_depth(child, depth, max_depth)
        # Decrease the depth
        depth -= 1

    return max_depth


def get_depth_from_index(node, idx, node_idx, depth, idx_depth):
    """
    Return the depth of a node based on the index. The index is based on
    depth-first left-to-right traversal.

    :param node: Current node
    :type node: list
    :param idx: Current index
    :type idx: int
    :param node_idx: Index of the node which depth we are searching for
    :type node_idx: int
    :param depth: Current depth
    :type depth: int
    :param idx_depth: Depth of the node at the given index
    :type idx_depth: int
    :return: Current index and depth of the node at the given index
    :rtype: tuple
    """

    # Assign the current depth when the current index matches the given index
    if node_idx == idx:
        idx_depth = depth

    idx += 1
    # Iterate over the children
    for child in get_children(node):
        # Increase the depth
        depth += 1
        # Recursively check the child depth and node index
        idx_depth, idx = get_depth_from_index(child, idx, node_idx, depth,
                                              idx_depth)
        # Decrease the depth
        depth -= 1

    return idx_depth, idx


def replace_subtree(new_subtree, old_subtree):
    """
    Replace a subtree.

    :param new_subtree: The new subtree
    :type new_subtree: list
    :param old_subtree: The old subtree
    :type old_subtree: list
    """

    # Delete the nodes of the old subtree
    del old_subtree[:]
    for node in new_subtree:
        # Insert the nodes in the new subtree
        old_subtree.append(copy.deepcopy(node))

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
    idx += 1

    # Check if index is a the given node
    if node_idx == idx:
        # Remove the root node
        del root[:]
        # Insert the subtree at the root node
        for node in subtree:
            root.append(node)
    else:
        # Iterate over the children
        for child in get_children(root):
            # Recursively travers the child
            idx = find_and_replace_subtree(child, subtree, node_idx, idx)

    return idx


def get_random_symbol(depth, max_depth, symbols, full=False):
    """
    Return a randomly chosen symbol. The depth determines if a terminal
    must be chosen. If full is specified a function will be chosen
    until the max depth. The symbols is picked with a uniform probability.

    :param depth: Current depth
    :type depth: int
    :param max_depth: Max depth determines if a function symbol can be
      chosen. I.e. a symbol with arity greater than zero
    :type max_depth: int
    :param symbols: The possible symbols.
    :type symbols: dict
    :param full: True if function symbols should be drawn until max depth
    :returns: A random symbol
    :rtype: str

    """

    # Pick a terminal if max depth has been reached
    if depth >= max_depth:
        # Pick a random terminal
        symbol = random.choice(symbols["terminals"])
    else:
        # Can it be a terminal before the max depth is reached
        # then there is 50% chance that it is a terminal
        if not full and bool(random.getrandbits(1)):
            # Pick a random terminal
            symbol = random.choice(symbols["terminals"])
        else:
            # Pick a random function
            symbol = random.choice(symbols["functions"])

    # Return the picked symbol
    return symbol


def sort_population(individuals):
    """
    Return a list sorted on the fitness value of the individuals in
    the population. Descending order.

    :param individuals: The population of individuals
    :type individuals: list
    :return: THe population of individuals sorted by fitness in descending order
    :rtype: list

    """

    # Sort the individual elements on the fitness
    individuals = sorted(individuals, key=lambda x: x['fitness'])
    # Reverse for descending order
    individuals.reverse()

    return individuals


def evaluate_individual(individual, fitness_cases, targets, symbols=None):
    """
    Evaluate fitness based on fitness cases and target values. Fitness
    cases are a set of exemplars (input and output points) by
    comparing the error between the output of an individual(symbolic
    expression) and the target values.

    Evaluates and sets the fitness in an individual. Fitness is the
    negative mean square error(MSE).

    :param param:
    :param individual: Individual solution to evaluate
    :type individual: dict
    :param fitness_cases: Input for the evaluation
    :type fitness_cases: list
    :param targets: Output corresponding to the input
    :type targets: list
    """

    # Initial fitness value
    fitness = 0.0
    # Calculate the error between the output of the individual solution and
    # the target for each input
    for case, target in zip(fitness_cases, targets):
        # Get output from evaluation function
        output = evaluate(individual["genome"], case)
        # Get the squared error
        error = output - target
        fitness += error * error

    # Get the mean fitness and assign it to the individual
    individual["fitness"] = -fitness / float(len(targets))


def evaluate_nodes(root, case, functions):
    """
    Return the float value from the evaluation of the nodes. Non-recursive
    evaluation of the nodes. Depth first left-to-right traversal

    This function can be called from evaluate_individual instead of evaluate.

    :param root: Root of tree to evaluate
    :type root: list
    :param case: Current fitness case
    :type case: list
    :param functions: Function symbols (operators)
    :type functions: list
    :returns: Value of the evaluation
    :rtype: float
    """
    import operator
    # Unvisited nodes stack
    unvisited_nodes = [root]
    # Evaluation stack
    evaluation_stack = []
    # Breakout counter
    breakout_cnt = 0
    # Number of nodes in the tree
    n_nodes = get_number_of_nodes(root, 0)
    # Visit all the nodes in the tree and evaluate
    while unvisited_nodes and breakout_cnt < n_nodes:
        # Get unvisited node from the stack
        current_node = unvisited_nodes.pop(-1)
        # Add children to unvisited nodes stack
        children = get_children(current_node)[:]
        children.reverse()
        unvisited_nodes.extend(children)
        # Push current node to evaluation stack
        value = current_node[0]
        if value.startswith("x"):
            # Get the value of the input variables
            value = case[int(value[1:])]
        elif value not in functions:
            # Cast to a float
            value = float(value)
        # Push to evaluation stack
        evaluation_stack.append(value)

        # Loop over evaluation stack when there are enough values on it to
        # evaluate and the two top elements are not operators
        while len(evaluation_stack) > 2 and\
                        evaluation_stack[-1] not in functions and \
                        evaluation_stack[-2] not in functions:
            # Get operands from the evaluation stack
            operands = [evaluation_stack.pop(-1)]
            operands.insert(0, evaluation_stack.pop(-1))
            # Get operator from the evaluation stack
            _operator = evaluation_stack.pop(-1)
            if _operator == "+":
                # Addition operator
                value = operator.add(*operands)
            elif _operator == "-":
                # Subtraction operator
                value = operator.sub(*operands)
            elif _operator == "*":
                # Multiplication operator
                value = operator.mul(*operands)
            elif _operator == "/":
                # Protected division
                try:
                    value = operator.div(*operands)
                except ZeroDivisionError as e:
                    value = operands[0]
            else:
                # Unknown operator. Raise an exception
                raise ValueError(_operator)
            # Push the value from the operation to the evaluation stack
            evaluation_stack.append(value)

        # Increase the node breakout count
        breakout_cnt += 1

    # Assert that the value on the evaluation stack is a single value which
    # is not a function
    assert (len(evaluation_stack) == 1 and evaluation_stack[0] not in functions)

    return evaluation_stack[0]


def evaluate(node, case):
    """
    Evaluate a node recursively. The node's symbol string is evaluated.

    :param node: Evaluated node
    :type node: list
    :param case: Current fitness case
    :type case: list
    :returns: Value of the evaluation
    :rtype: float
    """

    symbol = node[0]
    # Identify the node symbol
    if symbol == "+":
        # Add the values of the node's children
        return evaluate(node[1], case) + evaluate(node[2], case)

    elif symbol == "-":
        # Subtract the values of the node's children
        return evaluate(node[1], case) - evaluate(node[2], case)

    elif symbol == "*":
        # Multiply the values of the node's children
        return evaluate(node[1], case) * evaluate(node[2], case)

    elif symbol == "/":
        # Divide the value's of the nodes children. Too low values of the
        # denominator returns the numerator
        numerator = evaluate(node[1], case)
        denominator = evaluate(node[2], case)
        if abs(denominator) < 0.00001:
            denominator = 1

        return numerator / denominator

    elif symbol.startswith("x"):
        # Get the variable value
        return case[int(symbol[1:])]

    else:
        # The symbol is a constant
        return float(symbol)


def initialize_population(param):
    """
    Ramped half-half initialization. The individuals in the
    population are initialized using the grow or the full method for
    each depth value (ramped) up to max_depth.

    :param param: parameters for pony gp
    :type param: dict
    :returns: List of individuals
    :rtype: list
    """

    individuals = []
    for i in range(param["population_size"]):
        # Pick full or grow method
        full = bool(random.getrandbits(1))
        # Ramp the depth
        max_depth = (i % param["max_depth"]) + 1
        # Create root node
        symbol = get_random_symbol(1, max_depth, param["symbols"])
        tree = [symbol]
        # Grow the tree if the root is a function symbol
        if max_depth > 0 and symbol in param["symbols"]["functions"]:
            grow(tree, 1, max_depth, full, param["symbols"])

        # An individual is a dictionary
        individual = {
            "genome": tree,
            "fitness": DEFAULT_FITNESS
        }
        # Append the individual to the population
        individuals.append(individual)
        print('Initial tree %d: %s' % (i, tree))

    return individuals


def evaluate_fitness(individuals, param):
    """
    Perform the fitness evaluation for each individual of the population.

    :param individuals: Population to evaluate
    :type individuals: list
    :param param: parameters for pony gp
    :type param: dict
    """

    # Iterate over all the individual solutions
    for ind in individuals:
        # Execute the fitness function
        evaluate_individual(ind, param["fitness_cases"], param["targets"],
                            param["symbols"])


def search_loop(population, param):
    """
    Return the best individual from the evolutionary search
    loop. Starting from the initial population.

    :param population: Initial population of individuals
    :type population: list
    :param param: parameters for pony gp
    :type param: dict
    :returns: Best individual
    :rtype: Individual
    """

    # Evaluate fitness
    evaluate_fitness(population, param)
    # Print the stats of the population
    print_stats(0, population)
    # Set best solution
    sort_population(population)
    best_ever = population[0]

    # Generation loop
    generation = 1
    while generation < param["generations"]:
        new_population = []
        # Selection
        parents = tournament_selection(population, param)

        # Crossover
        while len(new_population) < param["population_size"]:
            # Select parents
            _parents = random.sample(parents, 2)
            # Generate children by crossing over the parents
            children = subtree_crossover(_parents[0], _parents[1], param)
            # Append the children to the new population
            for child in children:
                new_population.append(child)

        # Select population size individuals. Handles uneven population
        # sizes, since crossover returns 2 offspring
        new_population = new_population[:param["population_size"]]

        # Vary the population by mutation
        for i in range(len(new_population)):
            new_population[i] = subtree_mutation(new_population[i], param)

        # Evaluate fitness
        evaluate_fitness(new_population, param)

        # Replace population
        population = generational_replacement(new_population, population,
                                              param)
        # Print the stats of the population
        print_stats(generation, population)

        # Set best solution
        sort_population(population)
        best_ever = population[0]
        # Increase the generation counter
        generation += 1

    return best_ever


def print_stats(generation, individuals):
    """
    Print the statistics for the generation and population.

    :param generation:generation number
    :type generation: int
    :param individuals: population to get statistics for
    :type individuals: list
    """

    def get_ave_and_std(values):
        """
        Return average and standard deviation.

        :param values: Values to calculate on
        :type values: list
        :returns: Average and Standard deviation of the input values
        :rtype: tuple
        """
        _ave = float(sum(values)) / len(values)
        _std = math.sqrt(float(
            sum((value - _ave) ** 2 for value in values)) / len(values))
        return _ave, _std

    # Make sure individuals are sorted
    sort_population(individuals)
    # Get the fitness values
    fitness_values = [i["fitness"] for i in individuals]
    # Get the number of nodes
    size_values = [get_number_of_nodes(i["genome"], 0) for i in individuals]
    # Get the max depth
    depth_values = [get_max_tree_depth(i["genome"], 0, 0) for i in individuals]
    # Get average and standard deviation of fitness
    ave_fit, std_fit = get_ave_and_std(fitness_values)
    # Get average and standard deviation of size
    ave_size, std_size = get_ave_and_std(size_values)
    # Get average and standard deviation of max depth
    ave_depth, std_depth = get_ave_and_std(depth_values)
    # Print the statistics
    print(
        "Gen:%d fit_ave:%.2f+-%.3f size_ave:%.2f+-%.3f "
        "depth_ave:%.2f+-%.3f %s" %
        (generation,
         ave_fit, std_fit,
         ave_size, std_size,
         ave_depth, std_depth,
         individuals[0]))


def subtree_mutation(individual, param):
    """
    Return a new individual by randomly picking a node and growing a
    new subtree from it.

    :param individual: Individual to mutate
    :type individual: dict
    :param param: parameters for pony gp
    :type param: dict
    :returns: Mutated individual
    :rtype: list
    """

    # Copy the individual for mutation
    new_individual = {
        "genome": copy.deepcopy(individual["genome"]),
        "fitness": DEFAULT_FITNESS
    }
    # Check if mutation should be applied
    if random.random() < param["mutation_probability"]:
        # Pick node
        end_node_idx = get_number_of_nodes(new_individual["genome"], 0) - 1
        node_idx = random.randint(0, end_node_idx)
        node_depth, cnt = get_depth_from_index(new_individual["genome"], 0,
                                               node_idx, 0, 0)
        # Get a new symbol
        max_subtree_depth = param["max_depth"] - node_depth
        new_subtree = [get_random_symbol(max_subtree_depth,
                                         param["max_depth"],
                                         param["symbols"])
        ]
        # Grow tree if it was a function symbol
        if new_subtree[0] in param["symbols"]["functions"]:
            # Grow to full depth
            full = bool(random.getrandbits(1))
            # Grow subtree
            grow(new_subtree, node_depth, param["max_depth"], full,
                 param["symbols"])

        # Replace the original subtree with the new
        find_and_replace_subtree(new_individual["genome"], new_subtree,
                                 node_idx, -1)

    # Return the individual
    return new_individual


def subtree_crossover(parent1, parent2, param):
    """
    Returns two individuals. The individuals are created by
    selecting two random nodes from the parents and swapping the
    subtrees.

    # TODO control the depth of the child nodes

    :param parent1: Parent one to crossover
    :type parent1: dict
    :param parent2: Parent two to crossover
    :type parent2: dict
    :param param: parameters for pony gp
    :type param: dict
    :return: Children from the crossed over parents
    :rtype: tuple
    """
    # Copy the parents to make offsprings
    offsprings = ({
                      "genome": copy.deepcopy(parent1["genome"]),
                      "fitness": DEFAULT_FITNESS
                  },
                  {
                      "genome": copy.deepcopy(parent2["genome"]),
                      "fitness": DEFAULT_FITNESS
                  })

    # Check if offspring will be crossed over
    if random.random() < param["crossover_probability"]:
        xo_nodes = []
        for i, offspring in enumerate(offsprings):
            # Pick a crossover point
            end_node_idx = get_number_of_nodes(offsprings[i]["genome"], 0) - 1
            node_idx = random.randint(0, end_node_idx)
            # Find the subtree at the crossover point
            xo_nodes.append(get_node_at_index(offsprings[i]["genome"],
                                              node_idx))

        # Swap the nodes
        tmp_offspring_1_node = copy.deepcopy(xo_nodes[1])
        # Copy the children from the subtree of the first offspring
        # to the chosen node of the second offspring
        replace_subtree(xo_nodes[0], xo_nodes[1])
        # Copy the children from the subtree of the second offspring
        # to the chosen node of the first offspring
        replace_subtree(tmp_offspring_1_node, xo_nodes[0])

    # Return the offsprings
    return offsprings


def tournament_selection(population, param):
    """
    Return individuals from a population by drawing
    `tournament_size` competitors randomly and selecting the best
    of the competitors. `population_size` number of tournaments are
    held.

    :param population: Population to select from
    :type population: list
    :param param: parameters for pony gp
    :type param: dict
    :returns: selected individuals
    :rtype: list
    """

    # Iterate until there are enough tournament winners selected
    winners = []
    while len(winners) < param["population_size"]:
        # Randomly select tournament size individual solutions
        # from the population.
        competitors = random.sample(population, param["tournament_size"])
        # Rank the selected solutions
        competitors = sort_population(competitors)
        # Append the best solution to the winners
        winners.append(competitors[0])

    return winners


def generational_replacement(new_population, old_population, param):
    """
    Return new a population. The `elite_size` best old_population
    are appended to the new population. They are kept in the new
    population if they are better than the worst.

    :param new_population: the new population
    :type new_population: list
    :param old_population: the old population
    :type old_population: list
    :param param: parameters for pony gp
    :type param: dict
    :returns: the new population with the best from the old population
    :rtype: list
    """

    # Sort the population
    old_population = sort_population(old_population)
    # Append a copy of the best solutions of the old population to
    # the new population. ELITE_SIZE are taken
    for ind in old_population[:param["elite_size"]]:
        new_population.append(copy.deepcopy(ind))

    # Sort the new population
    new_population = sort_population(new_population)

    # Set the new population size
    return new_population[:param["population_size"]]


def run(param):
    """
    Return the best solution. Create an initial
    population. Perform an evolutionary search.

:param param: parameters for pony gp
    :type param: dict
    :returns: Best solution
    :rtype: dict
    """

    # Create population
    population = initialize_population(param)
    # Start evolutionary search
    best_ever = search_loop(population, param)

    return best_ever


def parse_exemplars(file_name):
    """
    Parse a CSV file. Parse the fitness case and split the data into
    Test and train data. In the fitness case file each row is an exemplar
    and each dimension is in a column. The last column is the target value of
    the exemplar.

    :param file_name: CSV file with header
    :type file_name: str
    :return: Fitness cases and targets
    :rtype: list
    """

    # Open file
    in_file = open(file_name, 'r')
    # Create a CSV file reader
    reader = csv.reader(in_file, delimiter=',')

    # Read the header
    headers = reader.next()
    print("Reading: %s headers: %s" % (file_name, headers))

    # Store fitness cases and their target values
    fitness_cases = []
    targets = []
    for row in reader:
        # Parse the columns to floats and append to fitness cases
        fitness_cases.append(map(float, row[:-1]))
        # The last column is the target
        targets.append(float(row[-1]))

    in_file.close()

    return fitness_cases, targets


def get_symbols():
    """
    Return a symbol dictionary. Helper method to keep the code clean. The nodes in
    a GP tree consists of different symbols. The symbols are either
    functions (internal nodes with arity > 0) or terminals (leaf nodes with
    arity = 0) The symbols is represented as a dictionary with the keys:

  - *arities* -- A dictionary where a key is a symbol and the value is the arity
  - *terminals* -- A list of strings(symbols) with arity 0
  - *functions* -- A list of strings(symbols) with arity > 0


    :return: Symbols used for GP individuals
    :rtype: dict
    """

    # Dictionary of symbols and their arity
    arities = {"1": 0,
               "x0": 0,
               "x1": 0,
               "+": 2,
               "-": 2,
               "*": 2,
               "/": 2,
    }
    # List of terminal symbols
    terminals = []
    # List of function symbols
    functions = []

    # Append symbols to terminals or functions by looping over the
    # arities items
    for key, value in arities.items():
        # A symbol with arity 0 is a terminal
        if value == 0:
            # Append the symbols to the terminals list
            terminals.append(key)
        else:
            # Append the symbols to the functions list
            functions.append(key)

    return {"arities": arities, "terminals": terminals, "functions": functions}


def get_test_and_train_data(fitness_cases_file, test_train_split):
    """
    Return test and train data.

    :param fitness_cases_file: CSV file with a header.
    :type fitness_cases_file: str
    :param test_train_split: Percentage of exemplar data used for training
    :type test_train_split: float
    :return: Test and train data. Both cases and targets
    :rtype: tuple
    """

    fitness_cases, targets = parse_exemplars(fitness_cases_file)
    # TODO get random cases instead of according to index
    split_idx = int(math.floor(len(fitness_cases) * test_train_split))
    training_cases = fitness_cases[:split_idx]
    test_cases = fitness_cases[split_idx:]
    training_targets = targets[:split_idx]
    test_targets = targets[split_idx:]
    return ({"fitness_cases": test_cases, "targets": test_targets},
            {"fitness_cases": training_cases, "targets": training_targets})


def parse_arguments():
    """
    Returns a dictionary of the default parameters, or the ones set by
    commandline arguments

    :return: parameters for the GP run
    :rtype: dict
    """
    # Command line arguments
    parser = optparse.OptionParser()
    # Population size
    parser.add_option("-p", "--population_size", type=int, default=10,
                      dest="population_size", help="population size")
    # Size of an individual
    parser.add_option("-m", "--max_depth", type=int, default=3,
                      dest="max_depth", help="Max depth of tree")
    # Number of elites, i.e. the top solution from the old population
    # transferred to the new population
    parser.add_option("-e", "--elite_size", type=int, default=1,
                      dest="elite_size", help="elite size")
    # Generations is the number of times the EA will iterate the search loop
    parser.add_option("-g", "--generations", type=int, default=10,
                      dest="generations", help="number of generations")
    # Tournament size
    parser.add_option("--ts", "--tournament_size", type=int, default=2,
                      dest="tournament_size", help="tournament size")
    # Random seed. Used to allow replication of runs of the EA. The search is
    # stochastic and and replication of the results can be guaranteed by using
    # the same random seed
    parser.add_option("-s", "--seed", type=int, default=0,
                      dest="seed", help="seed number")
    # Probability of crossover
    parser.add_option("--cp", "--crossover_probability", type=float,
                      dest="crossover_probability",
                      default=0.8, help="crossover probability")
    # Probability of mutation
    parser.add_option("--mp", "--mutation_probability", type=float,
                      dest="mutation_probability",
                      default=0.1, help="mutation probability")
    # Fitness case file
    parser.add_option("--fc", "--fitness_cases", default="fitness_cases.csv",
                      dest="fitness_cases",
                      help="fitness cases file")
    # Test-training data split
    parser.add_option("--tts", "--test_train_split", type=float, default=0.7,
                      dest="test_train_split",
                      help="test-train data split")
    # Parse the command line arguments
    options, args = parser.parse_args()
    return options


def main():
    """Search. Evaluate best solution on out-of-sample data"""

    args = parse_arguments()
    # Set arguments
    seed = args.seed
    test_train_split = args.test_train_split
    fitness_cases_file = args.fitness_cases
    # Get the exemplars
    test, train = get_test_and_train_data(fitness_cases_file, test_train_split)
    # Get the symbols
    symbols = get_symbols()

    # Print EA settings
    print(args, symbols)

    # Set random seed if not 0 is passed in as the seed
    if seed != 0:
        random.seed(seed)

    # Get the namespace dictionary
    param = vars(args)
    param["symbols"] = symbols
    param["fitness_cases"] = train["fitness_cases"]
    param["targets"] = train["targets"]
    best_ever = run(param)
    print("Best train:" + str(best_ever))
    # Test on out-of-sample data
    out_of_sample_test(best_ever, test["fitness_cases"], test["targets"],
                       param["symbols"])


def out_of_sample_test(individual, fitness_cases, targets, symbols):
    """
    Out-of-sample test on an individual solution

    :param individual: Solution to test on data
    :type individual: dict
    :param fitness_cases: Input data used for testing
    :type fitness_cases: list
    :param targets: Target values of data
    :type targets: list
    """
    evaluate_individual(individual, fitness_cases, targets, symbols)
    print("Best test:" + str(individual))


if __name__ == '__main__':
    main()
