//Follow http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//TODO Document
//TODO Compile the javascript, use minify, YUI or Closure Compiler
//TODO seems to be able to go diagonally. Use fixed look up tables instead of trigonometry?
//TODO Verify that check environment for the AI player works
"use strict";

//Frames per second
var FRAMES_PER_SECOND = 6;
//Board is square. Board size is ROWS*BIKE_WIDTH
var ROWS = 12;
var COLS = ROWS;
//Bike is square
var BIKE_WIDTH = 75;

var BIKE_HEIGHT = BIKE_WIDTH;

//Canvas to draw on
var canvas = document.getElementById('game');
//Context on canvas
var ctx = canvas.getContext('2d');
// Set canvas size to match the Tron board rows and bike width
canvas.width = COLS * BIKE_WIDTH;
canvas.height = ROWS * BIKE_HEIGHT;

var red_bike_img = new Image();
red_bike_img.src = '../Tron_bike_red.png'
var blue_bike_img = new Image();
blue_bike_img.src =  '../Tron_bike_blue.png'

//Game board. 0 is empty
var board = [];
for (var i = 0; i < ROWS; i++) {
    var board_square = [];
    for (var j = 0; j < COLS; j++) {
        board_square.push(0);
    }
    board.push(board_square);
}
//Directions player can move in [x, y] coordinates
var PLAYER_DIRECTIONS = [
    [0, 1], //East 'DOWN'
    [1, 0], //North 'RIGHT'
    [0, -1],//West 'UP'
    [-1, 0] //South 'LEFT'
];

var HUMAN_PLAYER = {
    //Position on board
    x: 1,
    y: Math.floor(ROWS / 2),
    //Direction on board [x,y]
    direction: [0, 1],
    COLOR: 'red',
    alive: true,
    ID: 0,
    bike_trail: [],
    ai: false
};
var AI_PLAYER = {
    x: Math.floor(ROWS / 2),
    y: Math.floor(ROWS / 2),
    direction: [0, 1],
    COLOR: 'blue',
    alive: true,
    ID: 1,
    bike_trail: [],
    ai: true,
    // Strategy for the AI
    strategy: ["if", ["is_obstacle_in_relative_direction", ["-1"]], ["left"], ["right"]]
};
//Array of players
var players = [HUMAN_PLAYER, AI_PLAYER];
var NUM_PLAYERS = players.length;

var game_over = false;
var stats_reported = false;
var timer;

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
            match = true;
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
    var symbol = node[0];

    switch(symbol){
        case "if":
            // Conditional statement

            // Check the condition to see which child to evaluate
            if (evaluate(node[1], player)) {
                evaluate(node[2], player);
            } else {
                evaluate(node[3], player);
            }
            break;
        case "is_obstacle_in_relative_direction":
            // Sense the distance

            // Parse the direction from the child node
            var direction = Number(node[1]);
            // Return if there is an obstacle the direction
            return is_obstacle_in_relative_direction(direction, player);
            break;
        case "left":
            // Turn left
            left(player);
            break;
        case "right":
            // Turn right
            right(player);
            break;
        case "ahead":
            break;
        default:
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
    var threshold = 1.0 / ROWS;
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
    return player["environment"][new_direction] / ROWS;
}

/**
 * Returns an integer point based on the current point and direction.
 *
 * @param {number} p point
 * @param {number} d direction
 * @return {number} new point
 */
function get_new_point(p, d) {
    return (p + d + ROWS) % ROWS;
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
        while (board[x_p][y_p] == 0 && distance < ROWS) {
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
    evaluate(player.strategy, player);
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
    ctx.fillStyle = '#666';
    // Fill a rectangle to the previous player position
    // This is to cover the bike up.
    // The modding and addind ROWS takes care of edge cases.
    var pre_pos_x = (player.x - player.direction[0] + ROWS) % ROWS
    var pre_pos_y = (player.y - player.direction[1] + COLS) % COLS;
    ctx.fillRect(pre_pos_x * BIKE_WIDTH, pre_pos_y * BIKE_HEIGHT,BIKE_WIDTH, BIKE_HEIGHT);
  
    //Draw the trail with a context line stroke.
    
    var prev_direction = player.bike_trail[player.bike_trail.length-2]
    var lightTrailPath = getLightTrail(pre_pos_x, pre_pos_y, player.direction, prev_direction)
    ctx.beginPath(); 
    ctx.lineWidth="6";
    ctx.strokeStyle=player.COLOR; 
    ctx.moveTo(lightTrailPath[0][0], lightTrailPath[0][1]);
    ctx.lineTo(lightTrailPath[1][0], lightTrailPath[1][1]);
    ctx.lineTo(lightTrailPath[2][0], lightTrailPath[2][1]);
    ctx.stroke(); 
  
    ctx.save()
    ctx.translate(player.x * BIKE_WIDTH, player.y * BIKE_HEIGHT)
    ctx.rotate(getImageRotation(player.direction))
    var Image_offset = getImageOffset(player.direction)
    if (player.COLOR === 'red'){
      ctx.drawImage(red_bike_img, (Image_offset[0])*BIKE_HEIGHT, (Image_offset[1])*BIKE_HEIGHT, BIKE_WIDTH, BIKE_HEIGHT)
    }else{
      console.log('prev',prev_direction)
      console.log('curr', player.direction)
      ctx.drawImage(blue_bike_img, (Image_offset[0])*BIKE_HEIGHT, (Image_offset[1])*BIKE_HEIGHT, BIKE_WIDTH, BIKE_HEIGHT)
    }
    ctx.restore()

}

function getImageRotation(player_direction){
  //can't compare by the array directly. [1,0] == [1,0] becomes false.
  if (player_direction[0] == 1)
    return Math.PI
  else if(player_direction[1] == 1)
    return -Math.PI/2
  else if(player_direction[0] == -1)
    return 0
  else
    return Math.PI/2
}

function getLightTrail(posx, posy, player_direction, player_prev_direction){
    var pos_1 = [(posx + 1/2 - 1/2*player_prev_direction[0])*BIKE_WIDTH, (posy+1/2 - 1/2*player_prev_direction[1])*BIKE_HEIGHT]
    var pos_2 = [(posx + 1/2)*BIKE_WIDTH, ((posy+1/2)*BIKE_HEIGHT)]
    var pos_3 = [(posx + 1/2 + 1/2*player_direction[0])*BIKE_WIDTH, (posy+1/2+1/2*player_direction[1])*BIKE_HEIGHT]
    return [pos_1,pos_2,pos_3]
  }
                 
//Drawing the image, rotated, at x,y is off by +- 1 in both x,y
//These numbers are to correct the offset. I don't know why they are what they are.
function getImageOffset(player_direction){
  if (player_direction[0] == 1)
    return [-1,-1]
  else if(player_direction[1] == 1)
    return [-1,0]
  else if(player_direction[0] == -1)
    return [0,0]
  else
    return [0, -1]
}


/**
 * Update the player. Move the player if it is alive. Check for
 * collision, i.e. board value is 1. Mark the board with a 1 at the
 * player coordinates.
 *
 * @param{Object} player
 */
function update(player,players) {
    //Move player
    if (player.alive) {
        move_bike(player);
    }
    //check for collision
    if (board[player.x][player.y] !== 0) {
        player["bike_trail"].push(player["direction"]);
        player.alive = false;
        for(var i = 0; i < players.length; i++){
            if ((players[i].x==player.x) && (players[i].y==player.y)){
                players[i].alive = false;
            }
        }
    } else {
        // Add the direction to the bike trail
        player["bike_trail"].push(player["direction"]);
        // Set the board value to the bike trail length
        board[player.x][player.y] = player["bike_trail"].length;
    }
}

/*
 * Game Over. Registers the winner.
 */

 function reload(){
  //resets the board
for (var i = 0; i < ROWS; i++) {
  board_square=[];
  for (var j = 0; j < COLS; j++) {
      board_square.push(0);
  }
  board[i]=board_square;
}
//erases the walls
  ctx.fillStyle = '#666';
  // Fill a rectangle.
  ctx.fillRect(0, 0,
      ROWS*BIKE_WIDTH, COLS*BIKE_HEIGHT);
  //brings players back to life
  for (var i = 0; i < NUM_PLAYERS; i++) {
    players[i].alive = true;
    players[i]["bike_trail"]=[];
      console.log('alive');
  }
  //resets player positions
  HUMAN_PLAYER.x= 1;
  HUMAN_PLAYER.y= Math.floor(ROWS / 2);
  HUMAN_PLAYER.direction= [0, 1];
  AI_PLAYER.x= Math.floor(ROWS / 2);
  AI_PLAYER.y= Math.floor(ROWS / 2);
  AI_PLAYER.direction= [0, 1];

  //resets game_over and stats_reported
  game_over=false;
  stats_reported=false; 
  timer=setInterval(step, 1000 / FRAMES_PER_SECOND);
  var scores=$('.playerScore');
      scores.each(function(){
        $(this).text(0);
  })

}

function end_game() {
  clearInterval(timer);

    var winner = -1;
    // Find the winner
    for (var i = 0; i < NUM_PLAYERS; i++) {
        if (players[i].alive === true) {
            winner = i;
            stats_reported = true;
        }
    }
    if(winner==-1){
      $('#winMessage').html('<h2>DRAW</h2>');
    }else{
      $('#winMessage').html('<h2>PLAYER '+winner+' WINS!</h2>');
    }
    $('#winPopup').dialog({
      resizable: false,
      height:250,
      width:500,
      modal: true,
      buttons: {
        "Play Again": function() {
          $( this).dialog('close');
          reload();
        }
      }
  })
}

/**
 * A step of the game clock, i.e. one round.
 */
function step() {
    //Move the players
    // console.log(stats_reported);
    if (!stats_reported) {
        for (var i = 0; i < NUM_PLAYERS; i++) {
            if (players[i].ai) {
                move_ai(players[i]);
            }
            // Update the player
            update(players[i],players);
            // Draw the player
            draw(players[i]);
        }
    }
    //Check if the players are alive
    for (var i = 0; i < NUM_PLAYERS; i++) {
        if (players[i].alive === false) {
            game_over = true;
        }
    }
    //Game over?
    if (game_over) {
        //TODO better way of only registering game once
        if (!stats_reported) {
            end_game();
        }
    }else{
      var scores=$('.playerScore');
      scores.each(function(){
        var current=parseInt($(this).text(),10);
        $(this).text(current+1);
      })
    }
}


//TODO hardcoded to handle only HUMAN_PLAYER as the human player
//Determine the actions when a key is pressed. 
document.onkeydown = function read(event) {
    //The variable e is passed into read or a window event
    var e = event || window.event;
    //The event code
    var code = e.keyCode || e.which;
    //Check the event code
    if (code === 37 || code === 39) {
        //Current direction of HUMAN_PLAYER
        var direction = HUMAN_PLAYER.direction;
        console.log("current direction is: " + direction[0] + " " + direction[1]);
        switch (code) {
            //Left arrow    
            case 37:
                //switch directions to the next direction in the PLAYER_DIRECTIONS array
                left(HUMAN_PLAYER);
                break;
            //Right arrow
            case 39:
                //switch directions to the previous direction in the PLAYER_DIRECTIONS array
                right(HUMAN_PLAYER);
                break;
        }
    }
};


$(function(){
  //can also use buttons to control player
  $('#leftButton').on('click', function(){
    var direction = HUMAN_PLAYER.direction;
    console.log("current direction is: " + direction[0] + " " + direction[1]);
      left(HUMAN_PLAYER);
  })
  $('#rightButton').on('click', function(){
    var direction = HUMAN_PLAYER.direction;
    console.log("current direction is: " + direction[0] + " " + direction[1]);
      right(HUMAN_PLAYER);
  })

  $('#startButton').on('click', function(){
    //Set the function which is called after each interval
    timer=setInterval(step, 1000 / FRAMES_PER_SECOND);
  })

  players.forEach(function(player){
    var name;
    if (player.ai){
      name='AI';
    }else{
      name='Human Player';
    }
    var color=player.COLOR;
    var label=$('<div class="playerLabel">');
    var pName=$('<span class="playerName">');
    pName.text(name+': ');
    var pScore=$('<span class="playerScore">');
    pScore.text(0);
    $(label).append(pName);
    $(label).append(pScore);
    $(label).css('color', color);
    $('#playerScores').append(label);

  })

})

