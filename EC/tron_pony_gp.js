//Follow http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//TODO Document
//TODO Compile the javascript, use minify, YUI or Closure Compiler
//TODO Verify that check environment for the AI player works
//TODO Get array length as a variable before the loops
//TODO Create param objects for the global variables
//TODO Refactor and optimize (e.g. jQuery) (That is a different software project, this is for ease of use and readability for JS beginners
//TODO Functional programming implementation of GP with JS

var PLAYER_DIRECTIONS = [
    [0, 1], //East
    [1, 0], //North
    [0, -1],//West
    [-1, 0] //South
];

(function tron_pony_gp() {
    "use strict";

    var tron_params = {
//Frames per second
        FRAMES_PER_SECOND: 6,
//Board is square. Board size is ROWS*BIKE_WIDTH
        ROWS: 20,
//Bike is square
        BIKE_WIDTH: 4,
        DRAW_BOARD: false,
        tron_game_id: undefined,
//Canvas to draw on
        canvas: document.getElementById('game'),
//Directions player can move in [x, y] coordinates
        board: undefined,
        players: undefined,
        NUM_PLAYERS: undefined,
        game_over: undefined,
        stats_reported: undefined

    };
    tron_params['COL'] = tron_params['ROWS'];
    tron_params['BIKE_HEIGHT'] = tron_params['BIKE_WIDTH;'];
// Set canvas size to match the Tron board rows and bike width
    tron_params['canvas'].width = tron_params['COL'] * tron_params['BIKE_WIDTH'];
    tron_params['canvas'].height = tron_params['ROWS'] * tron_params['BIKE_HEIGHT'];
//Context on canvas
    tron_params['ctx'] = tron_params['canvas'].getContext('2d');


    function setup_tron(strategy_0, strategy_1) {
//Game board. 0 is empty
        tron_params['board'] = [];
        for (var i = 0; i < tron_params['ROWS']; i++) {
            var board_square = [];
            for (var j = 0; j < tron_params['COL']; j++) {
                board_square.push(0);
            }
            tron_params['board'].push(board_square);
        }
        var AI_PLAYER_1 = {
            //Position on board
            x: 1,
            y: Math.floor(tron_params['ROWS'] / 2),
            //Direction on board [x,y]
            direction: [0, 1],
            COLOR: 'red',
            alive: true,
            ID: 0,
            bike_trail: [],
            ai: true,
            score: 0,
            strategy: strategy_0
        };
        var AI_PLAYER_2 = {
            x: Math.floor(tron_params['ROWS'] / 2),
            y: Math.floor(tron_params['ROWS'] / 2),
            direction: [0, 1],
            COLOR: 'blue',
            alive: true,
            ID: 1,
            bike_trail: [],
            ai: true,
            score: 0,
            // Strategy for the AI
            strategy: strategy_1
        };
//Array of players
        tron_params['players'] = [AI_PLAYER_1, AI_PLAYER_2];
        tron_params['NUM_PLAYERS'] = tron_params['players'].length;

        tron_params['game_over'] = false;
        tron_params['stats_reported'] = false;
    }

    /**
     * Return the index of the direction in the PLAYER_DIRECTIONS array
     *
     * TODO is there a built in JS function for this?
     *
     * @param {Array.<number>} direction Direction to find the index of
     * @returns {number} The index of the direction in the PLAYER_DIRECTIONS array
     */
    function get_direction_index(direction) {
        var idx = 0;
        var match = false;
        while (!match && idx < PLAYER_DIRECTIONS.length) {
            if (PLAYER_DIRECTIONS[idx][0] == direction[0] && PLAYER_DIRECTIONS[idx][1] == direction[1]) {
                match = true
            } else {
                idx = idx + 1;
            }
        }
        return idx;
    }

    /**
     * Evaluate a node. Change the state of the player.
     *
     *  - Check the node label
     *  - Traverse depth-first left-to-right
     *  - Execute the function to change state of the program
     *
     * @param {Array.<Array>} node Node to evaluate
     * @param {Object} player Player that is evaluated
     * @returns {*}
     */
    function evaluate(node, player) {
        // Get the symbol of the node
        var symbol;
        if (typeof node === 'string') {
            symbol = node;
        } else {
            symbol = node[0];
        }
        if (symbol === "if") {
            // Conditional statement

            // Check the condition to see which child to evaluate
            if (evaluate(node[1], player)) {
                evaluate(node[2], player);
            } else {
                evaluate(node[3], player);
            }
        } else if (symbol === "is_obstacle_in_relative_direction") {
            // Sense the distance

            // Parse the direction from the child node
            var direction = Number(evaluate(node[1], player));
            // Return if there is an obstacle the direction
            return is_obstacle_in_relative_direction(direction, player);
        } else if (symbol === "left") {
            // Turn left
            left(player);
        } else if (symbol === "right") {
            // Turn right
            right(player);
        } else if (symbol === "ahead") {
            // Do nothing
        } else if (symbol === "0") {
            return Number(symbol);
        } else if (symbol === "1") {
            return Number(symbol);
        } else if (symbol === "-1") {
            return Number(symbol);
        } else {
            // Unknown symbol
            throw "Unknown symbol:" + symbol;
        }
    }

    /**
     * Return a boolean denoting if the distance to an obstacle in the
     * environment in the relative direction is one cell ahead.
     *
     * @param {number} direction
     * @param {Object} player
     * @returns {boolean}
     */
    function is_obstacle_in_relative_direction(direction, player) {
        // Threshold for how far ahead an obstacle is sensed
        var threshold = 1.0 / tron_params['ROWS'];
        // Distance to obstacle
        var dist = distance(direction, player);
        return dist < threshold;
    }

    /**
     * Return a float [0, 1] that is the distance in the
     * environment in the direction relative to the player direction
     * divided by the board length.
     *
     * @param {number} direction relative direction to look in
     * @param {Object} player player who is looking
     * @returns {number} distance to an obstacle in the direction
     */
    function distance(direction, player) {
        var direction_idx = get_direction_index(player["direction"]);
        var new_direction_idx = (direction_idx + PLAYER_DIRECTIONS.length + direction) % PLAYER_DIRECTIONS.length;
        var new_direction = PLAYER_DIRECTIONS[new_direction_idx];
        return player["environment"][new_direction] / tron_params['ROWS'];
    }

    /**
     * Returns an integer point based on the current point and direction.
     *
     * @param {number} p point
     * @param {number} d direction
     * @return {number} new point
     */
    function get_new_point(p, d) {
        return (p + d + tron_params['ROWS']) % tron_params['ROWS'];
    }

    /**
     * Find distance to obstacles(bike trails) in
     * of the current coordinates. Distance is measured in number of squares.
     *
     * @param{Object} player
     */
    function check_environment(player) {
        // Clear the environment
        player["environment"] = {};

        // Check in the directions
        for (var i = 0; i < PLAYER_DIRECTIONS.length; i++) {
            // Get the coordinates of the adjacent cell
            var x_p = get_new_point(player["x"], PLAYER_DIRECTIONS[i][0]);
            var y_p = get_new_point(player["y"], PLAYER_DIRECTIONS[i][1]);
            // Distance to obstacles
            var distance = 0;
            // Iterate over the cells for and stop for obstacles or when the length of the board is reached
            while (tron_params['board'][x_p][y_p] == 0 && distance < tron_params['ROWS']) {
                // Increase the distance
                distance = distance + 1;
                // Get the coordinates of the adjacent cell
                x_p = get_new_point(x_p, parseInt(PLAYER_DIRECTIONS[i][0]));
                y_p = get_new_point(y_p, parseInt(PLAYER_DIRECTIONS[i][1]));
            }
            // Set the distance to an obstacle in the direction
            player["environment"][PLAYER_DIRECTIONS[i]] = distance;
        }
    }

    /**
     * Change direction by turning left 90 degrees
     *
     * @param{Object} player Player to change the state of
     */
    function left(player) {
        var direction_idx = get_direction_index(player["direction"]);
        var new_direction_idx = (direction_idx + PLAYER_DIRECTIONS.length + 1) % PLAYER_DIRECTIONS.length;
        player.direction = PLAYER_DIRECTIONS[new_direction_idx];
    }

    /**
     * Change direction by turning right 90 degrees
     *
     * @param{Object} player Player to change the state of
     */
    function right(player) {
        var direction_idx = get_direction_index(player["direction"]);
        var new_direction_idx = (direction_idx + PLAYER_DIRECTIONS.length - 1) % PLAYER_DIRECTIONS.length;
        player.direction = PLAYER_DIRECTIONS[new_direction_idx];
    }

    /**
     * Move an ai player. Function for moving the ai player
     *
     * @param {Object} player player
     */
    function move_ai(player) {
        // Check the environment for obstacles
        check_environment(player);
        // Evaluate the player strategy
        try {
            evaluate(player.strategy, player);
        } catch (err) {
            console.log(err);
            console.log("KILL illegal AI:", tree_to_str(player['strategy']));
            player['alive'] = false;
        }
    }

    /**
     * Move a bike(player).
     *
     * @param {Object} player player
     */
    function move_bike(player) {
        // Get new x-coordinate
        player.x = get_new_point(player.x, player.direction[0]);
        // Get new y-coordinate
        player.y = get_new_point(player.y, player.direction[1]);
    }

    /**
     * Draw the player at the current coordinates on the canvas
     *
     * @param{Object} player
     */
    function draw(player) {
        // Set the fill style color
        ctx.fillStyle = player.COLOR;
        // Fill a rectangle.
        ctx.fillRect(player.x * tron_params['BIKE_WIDTH'],
                player.y * tron_params['BIKE_HEIGHT'],
            tron_params['BIKE_WIDTH'], tron_params['BIKE_HEIGHT']);
    }

    /**
     * Update the player. Move the player if it is alive. Check for
     * collision, i.e. board value is 1. Mark the board with a 1 at the
     * player coordinates.
     *
     * @param{Object} player
     */
    function update(player) {
        //Move player
        if (player.alive) {
            move_bike(player);
        }
        //check for collision
        if (tron_params['board'][player.x][player.y] !== 0) {
            player.alive = false;
        } else {
            //TODO handle head on collision
            // Add the direction to the bike trail
            player["bike_trail"].push(player["direction"]);
            // Set the board value to the bike trail length
            tron_params['board'][player.x][player.y] = player["bike_trail"].length;
        }
    }

    /*
     * Game Over. Registers the winner.
     */
    function end_game() {
        var winner = -1;
        // Find the winner
        for (var i = 0; i < tron_params['NUM_PLAYERS']; i++) {
            if (tron_params['players'][i].alive === true) {
                winner = i;
                tron_params['players'][i]['score'] = 1;
            }
        }
        console.log('Data: ' + winner);
        tron_params['stats_reported'] = true;
    }

    /**
     * A step of the game clock, i.e. one round.
     */
    function step() {
        //Move the players
        if (!tron_params['stats_reported']) {
            for (var i = 0; i < tron_params['NUM_PLAYERS']; i++) {
                if (tron_params['players'][i].ai) {
                    move_ai(tron_params['players'][i]);
                }
                // Update the player
                update(tron_params['players'][i]);
                // Draw the player
                if (tron_params['DRAW_BOARD']) {
                    draw(tron_params['players'][i]);
                }
            }
        }
        //Check if the players are alive
        for (var i = 0; i < tron_params['NUM_PLAYERS']; i++) {
            if (tron_params['players'][i].alive === false) {
                tron_params['game_over'] = true;
            }
        }
        //Game over?
        if (tron_params['game_over']) {
            //TODO better way of only registering game once
            if (!tron_params['stats_reported']) {
                end_game();
                clearInterval(tron_params['tron_game_id']);
                return true;
            }
        }
    }

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
            ahead: 0,
            left: 0,
            right: 0,
            "0": 0,
            "1": 0,
            "-1": 0,
            "is_obstacle_in_relative_direction": 1,
            "if": 3
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
        if (depth >= max_depth) {
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

    function evaluate_individuals(individuals) {
        //Set the function which is called after each interval
        console.log('evaluate_individuals 0:', tree_to_str(individuals[0]['genome']));
        console.log('evaluate_individuals 1:', tree_to_str(individuals[1]['genome']));
        setup_tron(individuals[0]['genome'], individuals[1]['genome']);
        //TODO this is only intermittently working
        //tron_game_id = setInterval(step, 1000 / FRAMES_PER_SECOND);
        var cnt = 0;
        var BRK = tron_params['ROWS'] * tron_params['COL']; //Cannot be larger than the board
        while (!tron_params['game_over'] && cnt < BRK) {
            step();
            cnt++;
        }
        individuals[0]['fitness'] += tron_params['players'][0]["score"];
        individuals[1]['fitness'] += tron_params['players'][1]["score"];
    }

    function evaluate_fitness(population) {
        // Evaluate fitness
        var SOLUTIONS = 2;
        for (var i = 0; i < population.length; i += SOLUTIONS) {
            evaluate_individuals([population[i], population[i + 1]]);
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
                var new_subtree = [get_random_symbol(max_subtree_depth, max_size, symbols)];
                if (contains(symbols['functions'], new_subtree[0])) {
                    var full = false;//get_random_boolean();
                    grow(new_subtree, node_info['idx_depth'], max_size, full, symbols);
                }
                find_and_replace_subtree(new_population[i]["genome"], new_subtree, node_idx, -1);
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
            console.log(i);
            console.log(tree_to_str(population[i]["genome"]));
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
        console.log('B initial eval');
        evaluate_fitness(population);
        console.log('A initial eval');

        // Generation loop
        var generation = 0;
        while (generation < params['generations']) {
            console.log('Start loop gen:', generation);
            // Selection
            console.log('B tournament:', generation);
            var new_population = tournament_selection(params['tournament_size'], population);
            console.log('B crossover:', generation);
            new_population = crossover(params['crossover_probability'], new_population);
            console.log('B mutation:', generation);
            mutation(params['mutation_probability'], new_population, params['max_size']);

            // Evaluate the new population
            console.log('B evaluation:', generation);
            evaluate_fitness(new_population);

            // Replace the population with the new population
            console.log('B replacement:', generation);
            population = new_population;

            print_stats(generation, new_population);

            // Increase the generation
            generation = generation + 1;
        }
    }

    var gp_params = {
        population_size: 400,
        max_size: 2,
        generations: 20,
        mutation_probability: 1.0,
        tournament_size: 2,
        crossover_probability: 1.0
    };
// TODO fix size for mutation and crossover, it bloats too easily for mutation
    gp(gp_params);
})();