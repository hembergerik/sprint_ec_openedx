/**
 * Created by erikhemberg on 7/16/14.
 */

// TODO refactor for oop

var DEFAULT_FITNESS = 1000;

// From http://indiegamr.com/generate-repeatable-random-numbers-in-js/
// the initial seed
Math.seed = 711;
Math.seededRandom = function (max, min) {
    Math.seed = (Math.seed * 9301 + 49297) % 233280;
    var rnd = Math.seed / 233280;
    return min + rnd * (max - min);
};

function copy_tree(tree) {
    var out = [];
    for (var i = 0; i < tree.length; i++) {
        if (typeof tree[i] === 'string') {
            out = tree;
        } else {
            out[i] = copy_tree(tree[i]);
        }
    }
    return out.slice(0);
}

function tree_to_str(tree) {
    return "(" + node_to_str(tree, "") + ")"
}

function node_to_str(tree, str) {
    if (typeof tree === 'string') {
        str += tree;
    } else {
        str += tree[0];
        for (var i = 1; i < tree.length; i++) {
            str += ",(";
            str = node_to_str(tree[i], str);
            str += ")";
        }
    }
    return str;
}

function get_symbols() {
    var arity = {
        1: 0,
        0: 0,
        "+": 2,
        "*": 2
    };

    var terminals = [];
    var functions = [];

    for (var key in arity) {
        if (arity.hasOwnProperty(key)) {
            if (arity[key] == 0) {
                terminals.push(key);
            } else {
                functions.push(key);
            }
        }
    }

    return {arity: arity, terminals: terminals, functions: functions};
}

var symbols = get_symbols();

function get_random() {
    return Math.seededRandom(0, 1);
}
function get_random_int(min, max) {
    return Math.floor(Math.seededRandom(min, max));
}

function get_random_boolean() {
    return Math.seededRandom(0, 1) < 0.5;
}

function get_random_symbol(depth, max_depth, symbols, full) {
    var symbol;
    if (depth >= (max_depth - 1)) {
        symbol = symbols["terminals"][get_random_int(0, symbols["terminals"].length)];
    } else {
        var terminal = get_random_boolean();
        if (!full && terminal) {
            symbol = symbols["terminals"][get_random_int(0, symbols["terminals"].length)];
        } else {
            symbol = symbols["functions"][get_random_int(0, symbols["functions"].length)];
        }
    }
    return symbol;
}

function sum(array) {
    return array.reduce(function (previous_value, current_value) {
        return previous_value + current_value;
    });
}

function sort_individuals(individual_0, individual_1) {
    if (individual_0["fitness"] < individual_1["fitness"]) {
        return 1;
    }
    if (individual_0["fitness"] > individual_1["fitness"]) {
        return -1;
    }
    return 0;
}

function evaluate(tree) {
    // Get the symbol of the node
    var symbol;
    if (typeof tree === 'string') {
        symbol = tree;
    } else {
        symbol = tree[0];
    }
    var value;
    if (symbol == "+") {
        value = evaluate(tree[1]) + evaluate(tree[2]);
    } else if (symbol == "*") {
        value = evaluate(tree[1]) * evaluate(tree[2]);
    } else if (symbol == "0") {
        value = Number(symbol);
    } else if (symbol == "1") {
        value = Number(symbol);
    } else {
        throw "Unknown symbol:" + symbol;
    }
    return value;
}

function evaluate_individual(individual) {
    return evaluate(individual);
}

function evaluate_fitness(population) {
    // Evaluate fitness
    for (var i = 0; i < population.length; i++) {
        population[i]["fitness"] = evaluate_individual(population[i]["genome"]);
    }
}

function get_ave_and_std(values) {
    var ave = sum(values) / values.length;
    var std = 0;
    for (var val in values) {
        std = std + Math.pow((val - ave), 2);
    }
    std = Math.sqrt(std / values.length);
    return [ave, std];
}

function get_max_tree_depth(node, depth, max_depth) {
    if (max_depth < depth) {
        max_depth = depth;
    }
    for (var i = 1; i < node.length; i++) {
        depth = depth + 1;
        max_depth = get_max_tree_depth(node[i], depth, max_depth);
        depth = depth - 1;
    }
    return max_depth;
}

function max(list) {
    return list.reduce(function(previous, current) {
        return previous > current ? previous : current;
    })
}

function min(list) {
    return list.reduce(function(previous, current) {
        return previous < current ? previous : current;
    })
}

function print_stats(generation, population) {
    population.sort(sort_individuals);
    var fitness_values = [];
    var sizes = [];
    var depths = [];
    for (var i = 0; i < population.length; i++) {
        fitness_values.push(population[i]["fitness"]);
        sizes.push(get_number_of_nodes(population[i]["genome"], 0));
        depths.push(get_max_tree_depth(population[i]["genome"], 0, 0));
    }
    var ave_and_std = get_ave_and_std(fitness_values);
    var ave_and_std_size = get_ave_and_std(sizes);
    var ave_and_std_depth = get_ave_and_std(depths);
    console.log("Gen:" + generation + " fit_ave:" + ave_and_std[0] + "+-" + ave_and_std[1] +
        " size_ave:" + ave_and_std_size[0] + "+-" + ave_and_std_size[1] +
        " depth_ave:" + ave_and_std_depth[0] + "+-" + ave_and_std_depth[1] +
        " " + population[0]["fitness"] + " " + tree_to_str(population[0]["genome"]));
    console.log("min_fit:" + min(fitness_values) + " max_fit:" + max(fitness_values) +
        " min_size:" + min(sizes) + " max_size:" + max(sizes) +
        " min_depth:" + min(depths) + " max_depth:" + max(depths))
}

function tournament_selection(tournament_size, population) {
    var new_population = [];
    while (new_population.length < population.length) {
        var competitors = [];
        // Randomly select competitors for the tournament
        for (var i = 0; i < tournament_size; i++) {
            var idx = get_random_int(0, population.length);
            competitors.push(population[idx]);
        }
        // Sort the competitors by fitness
        competitors.sort(sort_individuals);
        // Push the best competitor to the new population
        var winner = competitors[0]["genome"];
        winner = copy_tree(winner);
        new_population.push({genome: winner, fitness: DEFAULT_FITNESS});
    }
    return new_population;
}

function get_number_of_nodes(root, cnt) {
    cnt = cnt + 1;
    if (typeof root !== 'string') {
        for (var i = 1; i < root.length; i++) {
            cnt = get_number_of_nodes(root[i], cnt);
        }
    }
    return cnt;
}

function get_depth_from_index(node, tree_info, node_idx, depth) {

    if (node_idx == tree_info["idx"]) {
        tree_info["idx_depth"] = depth;
    }
    tree_info["idx"] = tree_info["idx"] + 1;
    for (var i = 1; i < node.length; i++) {
        depth = depth + 1;
        tree_info = get_depth_from_index(node[i], tree_info, node_idx, depth);
        depth = depth - 1;
    }
    return tree_info;
}

function find_and_replace_subtree(root, subtree, node_idx, idx) {
    idx = idx + 1;
    if (node_idx == idx) {
        replace_subtree(subtree, root);
    } else {
        for (var i = 1; i < root.length; i++) {
            idx = find_and_replace_subtree(root[i], subtree, node_idx, idx);
        }
    }
    return idx;
}

function mutation(mutation_probability, new_population, max_size) {
    for (var i = 0; i < new_population.length; i++) {
        // Mutate individuals
        if (get_random() < mutation_probability) {
            var end_node_idx = get_number_of_nodes(new_population[i]["genome"], 0) - 1;
            var node_idx = get_random_int(0, end_node_idx);
            var node_info = get_depth_from_index(new_population[i]["genome"], {idx_depth: 0, idx: 0}, node_idx, 0);
            var max_subtree_depth = max_size - node_info['idx_depth'];
            //console.log('mut', max_subtree_depth, max_size, node_info['idx_depth'], new_population[i]["genome"]);
            var new_subtree = [get_random_symbol(max_subtree_depth, max_size, symbols)];
            if (contains(symbols['functions'], new_subtree[0])) {
                var full = false;//get_random_boolean();
                grow(new_subtree, node_info['idx_depth'], max_size, full, symbols);
            }
            find_and_replace_subtree(new_population[i]["genome"], new_subtree, node_idx, -1);
            var new_depth = get_max_tree_depth(new_population[i]["genome"], 0, 0);
            //console.log('new depth:', new_depth, new_population[i]["genome"]);
        }
    }
}

function contains(array, obj) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}

function append_symbol(node, symbol, symbols) {
    var new_node;
    if (contains(symbols['terminals'], symbol)) {
        new_node = symbol;
    } else {
        new_node = [symbol];
    }
    node.push(new_node);
    return new_node
}

function grow(tree, depth, max_depth, full, symbols) {
    var symbol;
    if (typeof tree !== 'string') {
        symbol = tree[0];
    } else {
        symbol = tree;
    }
    for (var i = 0; i < symbols["arity"][symbol]; i++) {
        var new_symbol = get_random_symbol(depth, max_depth, symbols, full);
        var new_node = append_symbol(tree, new_symbol, symbols);
        var new_depth = depth + 1;
        if (contains(symbols['functions'], new_symbol)) {
            grow(new_node, new_depth, max_depth, full, symbols);
        }
    }
}

function initialize_population(population_size, max_size) {
    var population = [];
    for (var i = 0; i < population_size; i++) {
        var full = get_random_boolean();
        var max_depth = (i % max_size) + 1;
        var symbol = get_random_symbol(1, max_depth, symbols, full);
        var tree = [symbol];
        if (max_depth > 0 && contains(symbols["functions"], symbol)) {
            grow(tree, 1, max_depth, full, symbols);
        }
        population.push({genome: tree, fitness: DEFAULT_FITNESS});
        console.log(i, tree_to_str(population[i]["genome"]));
        console.log(population[i]["genome"]);
    }
    return population;
}

function get_node_at_index(root, idx) {
    var unvisited_nodes = [root];
    var node = root;
    var cnt = 0;
    while (cnt <= idx && unvisited_nodes.length > 0) {
        node = unvisited_nodes.pop();
        if (typeof node !== 'string') {
            for (var i = node.length - 1; i > 0; i--) {
                unvisited_nodes.push(node[i]);
            }
        } else {
            unvisited_nodes.push(node);
        }
        cnt = cnt + 1;
    }
    console.assert(idx - cnt == -1, "idx not matching cnt - 1");
    return node;
}

function replace_subtree(new_subtree, old_subtree) {
    if (typeof old_subtree !== 'string') {
        old_subtree.splice(0, old_subtree.length);
        if (typeof new_subtree === 'string') {
            old_subtree.push(new_subtree);
        } else {
            for (var i = 0; i < new_subtree.length; i++) {
                old_subtree.push(new_subtree[i]);
            }
        }
    } else {
        old_subtree = new_subtree;
    }
}

function crossover(crossover_probability, population) {
    var CHILDREN = 2;
    var new_population = [];
    for (var i = 0; i < population.length; i = i + CHILDREN) {
        var children = [];
        for (var j = 0; j < CHILDREN; j++) {
            var idx = get_random_int(0, population.length);
            var genome = copy_tree(population[idx]["genome"]);
            var child = {
                genome: genome,
                fitness: DEFAULT_FITNESS
            };
            children.push(child);
        }
        if (get_random() < crossover_probability) {
            var xo_nodes = [];
            for (var j = 0; j < children.length; j++) {
                var end_node_idx = get_number_of_nodes(children[j]["genome"], 0) - 1;
                var node_idx = get_random_int(0, end_node_idx);
                xo_nodes.push(get_node_at_index(children[j]["genome"], node_idx));
            }
            var tmp_child_1_node = copy_tree(xo_nodes[1]);
            replace_subtree(xo_nodes[0], xo_nodes[1]);
            replace_subtree(tmp_child_1_node, xo_nodes[0]);
        }
        for (var j = 0; j < children.length; j++) {
            new_population.push(children[j]);
        }
    }
    return new_population;
}

function gp(params) {
    // Create population
    var population = initialize_population(params['population_size'],
        params['max_size']);
    evaluate_fitness(population);

    // Generation loop
    var generation = 0;
    while (generation < params['generations']) {
        // Selection
        var new_population = tournament_selection(params['tournament_size'], population);
        new_population = crossover(params['crossover_probability'], new_population);
        mutation(params['mutation_probability'], new_population, params['max_size']);

        // Evaluate the new population
        evaluate_fitness(new_population);

        // Replace the population with the new population
        population = new_population;

        print_stats(generation, new_population);

        // Increase the generation
        generation = generation + 1;
    }
}

var gp_params = {
    population_size: 8,
    max_size: 3,
    generations: 4,
    mutation_probability: 1.0,
    tournament_size: 2,
    crossover_probability: 1.0
};
// TODO fix size for mutation and crossover, it bloats too easily for mutation
gp(gp_params);
