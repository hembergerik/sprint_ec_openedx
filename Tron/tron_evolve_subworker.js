//Subworker.
//Primary task is to EVALUATE A SET OF INDIVIDUALS.

function evaluate_individuals(individuals) {
    //Set the function which is called after each interval
    setup_tron(individuals[0]['genome'], individuals[1]['genome']);
    //TODO this is only intermittently working
    //tron_game_id = setInterval(step, 1000 / FRAMES_PER_SECOND);
    var cnt = 0;
    var BRK = tron_params['ROWS'] * tron_params['COLS']; //Cannot be larger than the board
    while (!tron_params['game_over'] && cnt < BRK) {
        step();
        cnt++;
    }
    individuals[0]['fitness'] += tron_params['players'][0]["score"];
    individuals[1]['fitness'] += tron_params['players'][1]["score"];
}

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
                return true;
            }
        }
    }

    function move_bike(player) {
        // Get new x-coordinate
        player.x = get_new_point(player.x, player.direction[0]);
        // Get new y-coordinate
        player.y = get_new_point(player.y, player.direction[1]);
    }

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
    var stats = [];

    function end_game() {
        var winner = -1;
        // Find the winner
        for (var i = 0; i < tron_params['NUM_PLAYERS']; i++) {
            if (tron_params['players'][i].alive === true) {
                winner = i;
                tron_params['players'][i]['score'] = 1;
            }

        }
        stats.push([tron_params['players'][0]['bike_trail'],
            tron_params['players'][1]['bike_trail']]);
        tron_params['stats_reported'] = true;
    }


var PLAYER_DIRECTIONS = [
    [0, 1], //East
    [1, 0], //North
    [0, -1],//West
    [-1, 0] //South
];

    var DEFAULT_FITNESS = -1000;

    function move_ai(player) {
        // Check the environment for obstacles
        check_environment(player);
        // Evaluate the player strategy
        try {
            evaluate(player.strategy, player);
        } catch (err) {
            console.log(err);
            console.log("KILL illegal AI:", JSON.stringify(player['strategy']));
            player['alive'] = false;
        }
    }

   function evaluate(node, player) {
        // Get the symbol of the node
        var symbol;
        if (typeof node === 'string') {
            symbol = node;
        } else {
            symbol = node[0];
        }
        switch (symbol) {
            case "IFLEQ":
                // Conditional statement

                // Check the condition to see which child to evaluate
                if (evaluate(node[1], player) <= evaluate(node[2], player)) {
                    return evaluate(node[3], player);
                } else {
                    return evaluate(node[4], player);
                }
            case "SENSE_A":
                // Sense the distance
                return distance(0, player);
            case "SENSE_L":
                // Sense the distance
                return distance(1, player);
            case "SENSE_R":
                // Sense the distance
                return distance(-1, player);
            case "TURN_LEFT":
                // Turn left
                left(player);
                break;
            case "TURN_RIGHT":
                // Turn right
                right(player);
                break
            case "+":
                return evaluate(node[1], player) + evaluate(node[2], player)
            case "-":
                return evaluate(node[1], player) - evaluate(node[2], player)
            case "0.1":
                return Number(symbol);
            case "0.3":
                return Number(symbol);
            case "0.6":
                return Number(symbol);
            default:
                // Unknown symbol
                throw "Unknown symbol:" + symbol;
        }
    }

    function distance(direction, player) {
        var direction_idx = get_direction_index(player["direction"]);
        var new_direction_idx = (direction_idx + PLAYER_DIRECTIONS.length + direction) % PLAYER_DIRECTIONS.length;
        var new_direction = PLAYER_DIRECTIONS[new_direction_idx];
        return player["environment"][new_direction] / tron_params['ROWS'];
    }

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

    function get_new_point(p, d) {
        return (p + d + tron_params['ROWS']) % tron_params['ROWS'];
    }


function evaluate_fitness(population) {
    // Evaluate fitness
    var SOLUTIONS = 2;
    if (population.length % 2 == 1){
      population.push({genome: ['TURN_LEFT']})
    }
    for (var i = 0; i < population.length; i += SOLUTIONS) {
        evaluate_individuals([population[i], population[i + 1]]);
    }
}

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
//Directions player can move in [x, y] coordinates
        board: undefined,
        players: undefined,
        NUM_PLAYERS: undefined,
        game_over: undefined,
        stats_reported: undefined

    };
    tron_params['COLS'] = tron_params['ROWS'];
    tron_params['BIKE_HEIGHT'] = tron_params['BIKE_WIDTH;'];



    function setup_tron(strategy_0, strategy_1) {
//Game board. 0 is empty
        tron_params['board'] = [];
        for (var i = 0; i < tron_params['ROWS']; i++) {
            var board_square = [];
            for (var j = 0; j < tron_params['COLS']; j++) {
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


self.addEventListener('message', function(e){
  population = e.data;
  evaluate_fitness(population);
});
