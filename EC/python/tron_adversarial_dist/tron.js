//Follow http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//TODO Document
//TODO Compile the javascript, use minify, YUI or Closure Compiler
//TODO seems to be able to go diagonally. Use fixed look up tables instead of trigonometry?
//TODO Verify that check environment for the AI player works

//Canvas to draw on
var canvas = document.getElementById('game');
//Context on canvas
var ctx = canvas.getContext('2d');
//Frames per second
var FPS = 6;
//Board is square. Board size is ROWS*BIKE_WIDTH
var ROWS = 20;
var COLS = ROWS;
//Bike is square
var BIKE_WIDTH = 10;
var BIKE_HEIGTH = BIKE_WIDTH;
//Game board. 0 is empty
var board = [];
for (var i = 0; i < ROWS; i++) {
    var board_square = [];
    for (var j = 0; j < COLS; j++) {
	board_square.push(0);
    }
    board.push(board_square);
}
//Associative array of directions [-1,0,1] Used as a look-up table for
//checking the environment of AI players
var DIRECTIONS = {    
    '-1': 0, 
    '0': 1,
    '1': 2
};
var NUM_DIRECTIONS = Object.keys(DIRECTIONS).length;
//all possible directions
//TODO Katherine is the AI using the PLAYER_DIRECTIONS to turn as well?
var PLAYER_DIRECTIONS = {
    0: [0,1], 
    1: [1,0],
    2: [0,-1], 
    3: [-1,0]
};
//Get Ai Player
var GET_AI_PLAYER = false;

var Player1 = {
    //Position on board
    x: 1,
    y: 0,
    //Direction on board [x,y]
    direction: [0, 1],
    COLOR: 'red',
    alive: true,
    ID: 0,
    ai: false
}
var Player2 = {
    x: 2,
    y: 0,
    direction: [0, 1],
    COLOR: 'blue',
    alive: true,
    ID: 1,
    ai: true,
    strategy: ""
}
//Array of players
var players = [Player1, Player2];
var NUM_PLAYERS = players.length;;

var game_over = false;
var stats_reported = false;

/**
* Returns the x and y coordinates in the range [-1, 1] based on the
* angle in radians.
* @param {number} Angle in radians
* @return {Array.<number>} Coordinates
*/
function angle_to_coordinate(angle){
    var coordinate = [Math.cos(angle),
		      Math.sin(angle)];
    return coordinate;    
}

/**
* Return the angle in radians from the x and y coordinates.
* @param {number} x coordinate
* @param {number} y coordinate
* @return {number} angle in radians
*/
function coordinate_to_angle(x, y){
    var angle = Math.atan2(y, x);
   return angle;
}

/**
 * Move an ai player. Function for testing the ai player
 * @param {Object} player player
 */
function move_ai(player){
    var x = player.x;
    var y = player.y;
    var direction_x = player.direction[0];
    var direction_y = player.direction[1];
    var environment = check_environment(x, y);
    var keysym;
    eval(player.strategy);
    if (keysym == "Left") {
	player.direction = left(player.direction);
    } else {
	if (keysym == "Right") {
	    player.direction = right(player.direction);
	}
    }
}

/**
* Returns an integer point based on the current point and direction.
* @param {number} point p
* @param {number} direction d
* @return {number} new point p_p
*/
function get_new_point(p, d) {
    var p_p = (p + d) % ROWS; 
    if (p_p < 0) {
	p_p = ROWS + p_p;
    }
    return Math.floor(p_p);
}

/**
 * Find distance to obstacles in all directions of the current
 * coordinate, the environment. 
 * @param{number} x coordinate
 * @param{number} y coordinate
 * @return{Array.<Array<number>>} distance to obstacles  
 */
function check_environment(x, y) {
    var environment = [];
    var directions = Object.keys(DIRECTIONS);
    for (var i = 0; i < NUM_DIRECTIONS; i++) {
	var row = [];
	for (var j = 0; j < NUM_DIRECTIONS; j++) {
	    var x_p = get_new_point(x, parseInt(directions[i]));
	    var y_p = get_new_point(y, parseInt(directions[j]));
	    var square_value = 0;
	    while (board[x_p][y_p] <= 0 && square_value < ROWS) {
	        square_value = square_value + 1;
		x_p = get_new_point(x_p, parseInt(directions[i]));
		y_p = get_new_point(y_p, parseInt(directions[j]));
	    }
	    row.push(square_value);
	}
	environment.push(row);
    }
    //console.log('check_environment:'+environment);
    return environment;
}

/**
 * Used by the AI. See if the distance in the environment in the direction is
 * lower than a threshold. 
 * @param{number} threshold
 * @param{number} direction_x
 * @param{number} direction_y
 * @param{Array.<Array.<number>>} environment
 * @return{boolean} true if distance to object is lower than threshold
 */
function look_ahead(threshold, direction_x, direction_y, environment) {
    return environment[DIRECTIONS[direction_x]][DIRECTIONS[direction_y]] < threshold;
}

/**
 * Used by the AI. See if the distance in the environment to the left of
 * the current direction is lower than a threshold. 
 * @param{number} threshold
 * @param{number} direction_x
 * @param{number} direction_y
 * @param{Array.<Array.<number>>} environment
 * @return{boolean} true if distance to object is lower than threshold
 */
function look_left(threshold, x, y, environment) {
    var directionkey = getDirectionKey(Player2.direction);
    var direction = PLAYER_DIRECTIONS[(parseInt(directionkey)+1)%4];
    x = direction[0];
    y = direction[1];
    return environment[DIRECTIONS[x]][DIRECTIONS[y]] < threshold;
}

/**
 * Used by the AI. See if the distance in the environment to the right 
 * of the direction is lower than a threshold. 
 * @param{number} threshold
 * @param{number} direction_x
 * @param{number} direction_y
 * @param{Array.<Array.<number>>} environment
 * @return{boolean} true if distance to object is lower than threshold
 */
function look_right(threshold, x, y, environment) {
    var directionkey = getDirectionKey(Player2.direction);
    var direction = PLAYER_DIRECTIONS[(parseInt(directionkey)+3)%4];
    x = direction[0];
    y = direction[1];
    return environment[DIRECTIONS[x]][DIRECTIONS[y]] < threshold;
}

/**
 * Move a bike(player).
 * @param {Object} player player
 */
function move_bike(player){
    player.x = get_new_point(player.x, player.direction[0]);
    player.y = get_new_point(player.y, player.direction[1]);
//    console.log('move_bike p_id:'+player.ID+' p_x:'+player.x+' p_y:'+player.y+' x:'+player.direction[0]+' y:'+player.direction[1]);
}

/**
 * Draw the player at the current coordinates
 * @param{Object} player
 */
function draw(player){
    ctx.fillStyle = player.COLOR;
    ctx.fillRect(player.x*BIKE_WIDTH, player.y*BIKE_HEIGTH,
		 BIKE_WIDTH, BIKE_HEIGTH);
}

/**
 * Update the player. Move the player if it is alive. Check for
 * collision, i.e. board value is 1. Mark the board with a 1 at the
 * player coordinates.
 * @param{Object} player
 */
function update(player){
    //Move player
    if(player.alive){
        move_bike(player);
    }
    //check for collision
    if(board[player.x][player.y] == 1){
        player.alive = false;
    }
    //TODO handle head on collision
    board[player.x][player.y] = 1;
}
function getDirectionKey(direction){
        for (var key in PLAYER_DIRECTIONS){
            if (PLAYER_DIRECTIONS[key][0] == direction[0] && PLAYER_DIRECTIONS[key][1] == direction[1]){
                return key;
            }
        }
}

/**
 * A step_and_draw of the game clock, i.e. one round.
 */
function step_and_draw(){
    //Check if the players are alive
    for (var i = 0; i < NUM_PLAYERS; i++) {
	if (players[i].alive == false) {
	    game_over = true;
	}
    }
    //Move the players
    if (!stats_reported) {
	for (var i = 0; i < NUM_PLAYERS; i++) {
	    if (players[i].ai) {
		move_ai(players[i]);
	    }
	    update(players[i]);
	    draw(players[i]);	
	}
    }
    //Game over?
    if (game_over) {
	//TODO better way of only registring game once
	if (!stats_reported) {
	    end_game();
	} else {
	    return
	}
    }
}

/*
 * Game Over. Registers the winner.
 */
function end_game() {
	var winner = -1;
	for (var i = 0; i < NUM_PLAYERS; i++) {
	    if (players[i].alive == true) {
		winner = i;
	    }
	}
    //TODO send json object to python
    var url = "http://128.52.173.90/Tron/sprint_ec_openedx/EC/python/tron_adversarial_dist/register_results.py?winner=" + winner + "&id=" + 1;
	getJSON(url, function(data) {
	console.log('Data: ' + data.winner + ' id:' + data.id);
	    stats_reported = true;
    });

}

var getJSON = function(url, successHandler, errorHandler) {
  var xhr = typeof XMLHttpRequest != 'undefined'
    ? new XMLHttpRequest()
    : new ActiveXObject('Microsoft.XMLHTTP');
  //xhr.overrideMimeType("application/json"); 
  xhr.open('get', url, true);
  xhr.onreadystatechange = function() {
    var status;
    var data;
    if (xhr.readyState == 4) { // `DONE`
      status = xhr.status;
      if (status == 200) {
          data = JSON.parse(xhr.responseText);
        successHandler && successHandler(data);
      } else {
        errorHandler && errorHandler(status);
      }
    }
  };
  xhr.send();
};

if (GET_AI_PLAYER) {
    getJSON("http://128.30.109.173/stu_tron/get_ai_opponent.py", function(data) {
	console.log('Data: ' + data.PlayerAI);
	Player2.strategy = data.PlayerAI;
    });
}

/*
 * Left
 * @param{Array.<number>} direction
 */
function left(direction) {
    var directionkey = getDirectionKey(direction);
    directionkey = (parseInt(directionkey)+1);
    var new_direction = PLAYER_DIRECTIONS[directionkey%4];
    return new_direction;
}

/*
 * Right. Add 3 (number of directions - 1) instead of subtracting 1 to
 * avoid getting -1, which throws an error 
 * @param{Array.<number>} direction
 */
function right(direction) {
    var directionkey = getDirectionKey(direction);
    directionkey = (parseInt(directionkey)+3);
    var new_direction = PLAYER_DIRECTIONS[directionkey%4];
    return new_direction;
}

//Set the function which is called after each interval
setInterval(step_and_draw, 1000/FPS);

//TODO hardcoded to handle only Player1 as the human player
//Determine the actions when a key is pressed. 
document.onkeydown = function read(e){
    //The variable e is passed into read or a window event
    var e = e || window.event;
    //The event code
    var code = e.keyCode || e.which;
    //Check the event code
    if (code == 37 || code == 39) {
        //Current direction of Player1
        var direction = Player1.direction;
        console.log("current direction is: " + direction[0] + " " + direction[1]);
        //new direction
        var new_direction;
        switch(code){
            //Left arrow	    
        case 37:
            //switch directions to the next direction in the PLAYER_DIRECTIONS array
	    new_direction = left(direction);
                break;
            //Right arrow
        case 39:
	       //switch directions to the previous direction in the PLAYER_DIRECTIONS array
           //
            new_direction = right(direction);
                break;
        }
	//Set new direction
	Player1.direction = new_direction;
    }
}