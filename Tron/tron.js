//Follow google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
//TODO Document
//TODO Compile the javascript, use minify, YUI or Closure Compiler
//TODO seems to be able to go diagonally. Use fixed look up tables instead of trigonometry?
//TODO Verify that check environment for the AI player works
"use strict";
var GAME_PROPORTION_OF_PAGE = 0.8;
//Frames per second
var FRAMES_PER_SECOND = 6;
//Board is square. Board size is ROWS*BIKE_WIDTH
var ROWS = 20;
var COLS = ROWS;
//Bike is square
var smaller=Math.min($(window).height(),$(window).width());

var BIKE_WIDTH = Math.floor(smaller*GAME_PROPORTION_OF_PAGE/ROWS);
var BIKE_HEIGHT = BIKE_WIDTH;

var MOBILE_CUTOFF = 360;
var DEFAULT_FITNESS = 0;
//Canvas to draw on
var canvas = document.getElementById('game');
//Context on canvas
var ctx = canvas.getContext('2d');
// Set canvas size to match the Tron board rows and bike width
canvas.width = COLS * BIKE_WIDTH;
canvas.height = ROWS * BIKE_HEIGHT;
var started=false;

//array of strategies used by the AI
var STRATEGIES = [
["IFLEQ",["IFLEQ","0.3","TURN_LEFT","SENSE_R","SENSE_A"],["+","0.3","0.3"],["IFLEQ","SENSE_R","TURN_RIGHT","TURN_RIGHT","0.6"],["+","0.1","SENSE_A"]],
["IFLEQ",["IFLEQ",["TURN_LEFT"],["+","0.3","0.3"],["IFLEQ","SENSE_R","TURN_RIGHT","TURN_RIGHT","0.6"],["+","0.1","SENSE_A"]],["+","0.3","0.3"],["IFLEQ","SENSE_R","TURN_RIGHT","TURN_RIGHT","0.6"],["+","0.1","SENSE_A"]],
["-",["-",["0.3"],["IFLEQ",["IFLEQ","0.3","SENSE_L","0.6","TURN_RIGHT"],["-","0.3","SENSE_L"],["TURN_RIGHT"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]]],["IFLEQ",["-",["+","0.3","0.1"],["IFLEQ","0.1","0.3","SENSE_R","TURN_RIGHT"]],["-","0.3","SENSE_L"],["+","0.1","TURN_RIGHT"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]]],
["-",["-",["0.3"],["IFLEQ",["IFLEQ",["IFLEQ","0.3","SENSE_L","0.6","TURN_RIGHT"],["-","0.3","SENSE_L"],["+","0.1","TURN_RIGHT"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]],["-","0.3","SENSE_L"],["+","0.1","TURN_RIGHT"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]]],["IFLEQ",["-",["+","0.3","0.1"],["IFLEQ","0.1","0.3","SENSE_R","TURN_RIGHT"]],["-","0.3","SENSE_L"],["+","0.1","TURN_RIGHT"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]]],
["-",["-",["0.3"],["IFLEQ",["IFLEQ","0.3","SENSE_L","0.6","TURN_RIGHT"],["-","0.3","SENSE_L"],["-","0.3","0.1"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]]],["IFLEQ",["-",["+","0.3","0.1"],["IFLEQ","0.1","0.3","SENSE_R","TURN_RIGHT"]],["-","0.3","SENSE_L"],["+","0.1","TURN_RIGHT"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]]],
["-","0.6",["IFLEQ",["+",["IFLEQ",["+","SENSE_A","SENSE_R"],"SENSE_L","TURN_LEFT",["-","0.6","SENSE_L"]],["IFLEQ","SENSE_R","SENSE_A","0.3","TURN_RIGHT"]],"SENSE_R",["+",["+","TURN_RIGHT","0.3"],["IFLEQ","SENSE_R","0.3","SENSE_R","SENSE_A"]],"SENSE_A"]],
["-",["SENSE_A"],["IFLEQ",["IFLEQ",["+","SENSE_A","SENSE_A"],"0.3","0.3",["IFLEQ","0.3","SENSE_R","TURN_LEFT","TURN_RIGHT"]],["-",["TURN_LEFT"],["IFLEQ",["IFLEQ",["0.1"],["-","0.3","SENSE_L"],["+","0.1","TURN_RIGHT"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]],["-","0.3","SENSE_L"],["+","0.1","TURN_RIGHT"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]]],["+","0.1","TURN_RIGHT"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]]],
['0.6'],
["+",["IFLEQ",["+",["IFLEQ",["+",["0.3"],["0.3"]],["IFLEQ",["IFLEQ",["IFLEQ","TURN_RIGHT","SENSE_R",["SENSE_R"],"0.6"],["-","SENSE_A","SENSE_L"],["SENSE_R"],["SENSE_L"]],["SENSE_R"],["SENSE_A"],["+",["+","SENSE_A","0.3"],["IFLEQ","SENSE_L","0.1","SENSE_R","TURN_LEFT"]]],["SENSE_L"],["+",["+","SENSE_A","SENSE_R"],["IFLEQ","SENSE_L","0.1","SENSE_R","TURN_LEFT"]]],["IFLEQ",["0.3"],["SENSE_R"],["IFLEQ",["SENSE_L"],["-","SENSE_L","SENSE_R"],["TURN_RIGHT"],["IFLEQ","SENSE_L","TURN_RIGHT","SENSE_A","0.1"]],["+",["+","SENSE_A","SENSE_R"],["IFLEQ","SENSE_L","0.1","SENSE_R","TURN_LEFT"]]]],["IFLEQ",["IFLEQ",["IFLEQ","TURN_RIGHT","SENSE_R",["SENSE_R"],"0.6"],["-","SENSE_A","SENSE_L"],["SENSE_R"],["SENSE_L"]],["SENSE_R"],["SENSE_A"],["+",["TURN_LEFT"],["IFLEQ","SENSE_L","0.1","SENSE_R","TURN_LEFT"]]],["SENSE_L"],["+",["+","SENSE_A","SENSE_R"],["IFLEQ","SENSE_L","0.1","SENSE_R","TURN_LEFT"]]],["IFLEQ",["0.3"],["SENSE_R"],["IFLEQ",["SENSE_L"],["-","SENSE_L","SENSE_R"],["TURN_RIGHT"],["IFLEQ","SENSE_L","TURN_RIGHT","SENSE_A","0.1"]],["+",["+","SENSE_A","SENSE_R"],["IFLEQ","SENSE_L","0.1","SENSE_R","TURN_LEFT"]]]]
];

//array of names for the AI's with certain strategies
var AI_names = {'1' : 'Potato',
                '2' : 'Doorknob',
                '3': 'Trident &#945',
                '4': 'Seeker',
                '5': 'Trident &#946',
                '6': 'Serpent',
                '7': 'Skyline',
                '8': 'FailBot',
                '9': 'RageBot',
                '10': 'Evolve!' };

// Use Image constructor. $('<image>') will not work.
var red_bike_img = new Image();
red_bike_img.src = 'media/images/Tron_bike_red.png';
var blue_bike_img = new Image();
blue_bike_img.src =  'media/images/Tron_bike_blue.png';

var red_trail = new Image();
red_trail.src = 'media/images/Glow_Trail_Red_square.png';
var blue_trail = new Image();
blue_trail.src = 'media/images/Glow_Trail_blue_square.png';

var red_corner = new Image();
red_corner.src = 'media/images/Glow_Trail_Red_corner.png';
var blue_corner = new Image();
blue_corner.src = 'media/images/Glow_Trail_blue_corner.png';


var skins = [] ;


function skin_constructor(name, bikeurl, trailurl, cornerurl){
  var skin =  {
    name: name,
    bike_img: bikeurl,
    trail_img: trailurl,
    corner_img: cornerurl
  }
  skins.push(skin);
  return skin;
}


var red_bike_skin = skin_constructor('Red Bike', 'media/images/Tron_bike_red.png','media/images/Glow_Trail_Red_square.png','media/images/Glow_Trail_Red_corner.png');
var blue_bike_skin = skin_constructor('Blue Bike', 'media/images/Tron_bike_blue.png','media/images/Glow_Trail_blue_square.png',  'media/images/Glow_Trail_blue_corner.png');
var teal_bike_skin = skin_constructor('Teal Bike', 'media/images/Tron_bike_Teal.png', 'media/images/Glow_Trail_Teal.png', 'media/images/Glow_Trail_Teal_corner.png');
//var nyan_cat_skin = skin_constructor('nyan cat','media/images/Nyan_Cat.png', 'media/images/Nyan_Trail.png', 'media/images/Nyan_Corner.png');
var bubble_tank_skin = skin_constructor('BubbleTank', 'media/images/Bubble_Tanks.png', 'media/images/Bubble_Trail.png', 'media/images/Bubble_Corner.png');
var carbonate_skin = skin_constructor('Carbonate', 'media/images/Carbonate.png', 'media/images/Carbonate_trail.png', 'media/images/Carbonate_corner.png')
var potato_skin = skin_constructor('Potato', 'media/images/potatoBike.png', 'media/images/baconTrail.png', 'media/images/baconCorner.png')
var circuit_skin = skin_constructor('Circuit', 'media/images/Circuit_bike.png', 'media/images/Circuit_Trail.png', 'media/images/Circuit_corner.png')
var pacman_skin=skin_constructor('Pac-Man', 'media/images/pacBike.png', 'media/images/pacTrail.png', 'media/images/pacTrail.png')
var snake_skin=skin_constructor('Snake', 'media/images/snakeBike.png', 'media/images/snakeTrail.png', 'media/images/snakeCorner.png')


//@param red_or_blue: string, 'red' or 'blue'
//@param skin: built by skin_constructor.
function apply_skin(red_or_blue, skin){
  if (red_or_blue == 'red'){
    red_bike_img.src = skin.bike_img;
    red_trail.src = skin.trail_img;
    red_corner.src = skin.corner_img;
  }else if(red_or_blue == 'blue'){
    blue_bike_img.src = skin.bike_img;
    blue_trail.src = skin.trail_img;
    blue_corner.src = skin.corner_img;
  }else{
    throw 'error in apply skin: specify which bike to change skin';
  }
}



//$('<audio>') behaves better than new Audio(); in the page.
var BGM = $('<audio>')[0];
BGM.src = 'media/Tron_Theme.mp3';
BGM.loop = true;
var Crash_effect = $('<audio>')[0];
Crash_effect.src = 'media/Tron_Crash.mp3';

var players;
var NUM_PLAYERS;
//sets up game board. 0 is empty
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

//initializes the 2 human and 2 ai players
var HUMAN_PLAYER = {
    name: 'HUMAN PLAYER 1',
    COLOR: 'red',
    alive: true,
    ID: 0,
    bike_trail: [],
    ai: false
};
var HUMAN_PLAYER_2 = {
    name: 'HUMAN PLAYER 2',
    COLOR: 'blue',
    alive: true,
    ID: 1,
    bike_trail: [],
    ai: false
};
var AI_PLAYER = {
    name: 'AI PLAYER 1',
    COLOR: 'red',
    alive: true,
    ID: 1,
    bike_trail: [],
    ai: true,
    // Strategy for the AI
    strategy: ["IFLEQ",["IFLEQ","0.3","TURN_LEFT","SENSE_R","SENSE_A"],["+","0.3","0.3"],["IFLEQ","SENSE_R","TURN_RIGHT","TURN_RIGHT","0.6"],["+","0.1","SENSE_A"]] 
};
var AI_PLAYER_2 = {
    name: 'AI PLAYER 2',
    x: Math.floor(ROWS / 4),
    y: Math.floor(ROWS / 2),
    direction: [-1, 0],
    COLOR: 'blue',
    alive: true,
    ID: 1,
    bike_trail: [],
    ai: true,
    // Strategy for the AI
    strategy: ["IFLEQ",["IFLEQ","0.3","TURN_LEFT","SENSE_R","SENSE_A"],["+","0.3","0.3"],["IFLEQ","SENSE_R","TURN_RIGHT","TURN_RIGHT","0.6"],["+","0.1","SENSE_A"]] 
};

var game_over = false;
var stats_reported = false;
var timer;
ctx.font=BIKE_WIDTH+"px Calibri";
ctx.fillStyle='#3effff';
ctx.fillText("Click to play",Math.floor((ROWS*BIKE_WIDTH/2)-(BIKE_WIDTH*2)),Math.floor((ROWS*BIKE_WIDTH/2)-(BIKE_WIDTH/2)));

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
    var xDirBool = PLAYER_DIRECTIONS[idx][0] == direction[0];
    var yDirBool = PLAYER_DIRECTIONS[idx][1] == direction[1];
    if (xDirBool && yDirBool) {
      match = true;
    } else {
      idx += 1;
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
  switch (symbol) {
    case "IFLEQ":
      // Conditional statement
      // Check the condition to see which child to evaluate
      if (evaluate(node[1], player) <= evaluate(node[2], player)) {
        return evaluate(node[3], player);
      } else {
        return evaluate(node[4], player);
      }
      break;
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
      break;
    case "+":
      return evaluate(node[1], player) + evaluate(node[2], player);
    case "-":
      return evaluate(node[1], player) - evaluate(node[2], player);
    case "0.1":
      return Number(symbol);
    case "0.3":
      return Number(symbol);
    case "0.6":
      return Number(symbol);
    default:
      // Unknown symbol
      //throw "Unknown symbol:" + symbol;
  }
}
    
function distance(direction, player) {
  var direction_idx = get_direction_index(player.direction);
  var new_direction_idx = (direction_idx + PLAYER_DIRECTIONS.length + direction) % PLAYER_DIRECTIONS.length;
  var new_direction = PLAYER_DIRECTIONS[new_direction_idx];
  return player.environment[new_direction] / ROWS;
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
  var direction_idx = get_direction_index(player.direction);
  var new_direction_idx = (direction_idx + PLAYER_DIRECTIONS.length + direction) % PLAYER_DIRECTIONS.length;
  var new_direction = PLAYER_DIRECTIONS[new_direction_idx];
  return player.environment[new_direction] / ROWS;
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
  player.environment = {};
  // Check in the directions
  for (var i = 0; i < PLAYER_DIRECTIONS.length; i++) {
    // Get the coordinates of the adjacent cell
    var x_p = get_new_point(player.x, PLAYER_DIRECTIONS[i][0]);
    var y_p = get_new_point(player.y, PLAYER_DIRECTIONS[i][1]);
    // Distance to obstacles
    var distance = 0;
    // Iterate over the cells for and stop for obstacles or when the length of the board is reached
    while (board[x_p][y_p] === 0 && distance < ROWS) {
      // Increase the distance
      distance = distance + 1;
      // Get the coordinates of the adjacent cell
      x_p = get_new_point(x_p, parseInt(PLAYER_DIRECTIONS[i][0]));
      y_p = get_new_point(y_p, parseInt(PLAYER_DIRECTIONS[i][1]));
    }
    // Set the distance to an obstacle in the direction
    player.environment[PLAYER_DIRECTIONS[i]] = distance;
  }
}

/**
 * Change direction by turning left 90 degrees
 * @param{Object} player Player to change the state of
 */
function left(player) {
  var direction_idx = get_direction_index(player.direction);
  var new_direction_idx = (direction_idx + PLAYER_DIRECTIONS.length + 1) % PLAYER_DIRECTIONS.length;
  player.direction = PLAYER_DIRECTIONS[new_direction_idx];
}

/**
 * Change direction by turning right 90 degrees
 * @param{Object} player Player to change the state of
 */
function right(player) {
  var direction_idx = get_direction_index(player.direction);
  var new_direction_idx = (direction_idx + PLAYER_DIRECTIONS.length - 1) % PLAYER_DIRECTIONS.length;
  player.direction = PLAYER_DIRECTIONS[new_direction_idx];
}

/**
 * Move an ai player. Function for moving the ai player
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
 * @param {Object} player player
 */
function move_bike(player) {
  if(!game_over){
    // Get new x-coordinate
    player.x = get_new_point(player.x, player.direction[0]);
    // Get new y-coordinate
    player.y = get_new_point(player.y, player.direction[1]);
  }
}

/**
 * Draw the player at the current coordinates on the canvas
 * @param{Object} player
 */
function draw(player) {
  // Set the fill style color
  // Fill a rectangle to the previous player position
  // This is to cover the bike up.
  // The modding and addind ROWS takes care of edge cases.
  var pre_pos_x = (player.x - player.direction[0] + ROWS) % ROWS;
  var pre_pos_y = (player.y - player.direction[1] + COLS) % COLS;
  ctx.clearRect(pre_pos_x * BIKE_WIDTH, pre_pos_y * BIKE_HEIGHT,BIKE_WIDTH, BIKE_HEIGHT);

  //Draw the trail with a context line stroke.
  
  var prev_direction;
  if(player.bike_trail.length>1){
    prev_direction = player.bike_trail[player.bike_trail.length-2];
  }else{
    prev_direction = player.bike_trail[0];
  }
  var lightTrailPath = getLightTrail(pre_pos_x, pre_pos_y, player.direction, prev_direction);
  var prev_trailScale = getLightTrailScale(prev_direction);
  var curr_trailScale = getLightTrailScale(player.direction);
  var rotation = getImageRotation(player.direction);
  /*ctx.beginPath(); 
  ctx.lineWidth="10";
  ctx.strokeStyle=player.COLOR; 
  ctx.moveTo(lightTrailPath[0][0], lightTrailPath[0][1]);
  ctx.lineTo(lightTrailPath[1][0], lightTrailPath[1][1]);
  ctx.lineTo(lightTrailPath[2][0], lightTrailPath[2][1]);
  ctx.stroke(); */
  if(player.bike_trail.length>3){  
    if (player.COLOR === 'red'){
      if(prev_direction[0] == player.direction[0] && prev_direction[1] == player.direction[1]){
        drawRotatedImage(red_trail, ctx,player.direction, pre_pos_x*BIKE_WIDTH, pre_pos_y*BIKE_HEIGHT, BIKE_WIDTH, BIKE_HEIGHT);
      }else{
        drawCorner(red_corner, ctx, prev_direction, player.direction, pre_pos_x*BIKE_WIDTH, pre_pos_y*BIKE_HEIGHT, BIKE_WIDTH, BIKE_HEIGHT);
      }
      drawRotatedImage(red_bike_img,ctx,player.direction, player.x*BIKE_WIDTH, player.y*BIKE_HEIGHT, BIKE_WIDTH, BIKE_HEIGHT);
    }else{
      if(prev_direction[0] == player.direction[0] && prev_direction[1] == player.direction[1]){
        drawRotatedImage(blue_trail, ctx,player.direction, pre_pos_x*BIKE_WIDTH, pre_pos_y*BIKE_HEIGHT, BIKE_WIDTH, BIKE_HEIGHT);
      }else{
        drawCorner(blue_corner, ctx, prev_direction, player.direction, pre_pos_x*BIKE_WIDTH, pre_pos_y*BIKE_HEIGHT, BIKE_WIDTH, BIKE_HEIGHT);
      }
      drawRotatedImage(blue_bike_img,ctx,player.direction, player.x*BIKE_WIDTH, player.y*BIKE_HEIGHT, BIKE_WIDTH, BIKE_HEIGHT);
    }
    ctx.restore();
  }
}

/**
 * Draws the image on the context
 *
 * @param {Image} image: image to be drawn
 * @param {Array} player_direction: the direction the play is facing
 * @param {number} x, y, w, h: the x position, y position, width, and height of the image
 */

function drawRotatedImage(image, context, player_direction, x, y, w, h){
  context.save();
  context.translate(x, y);
  context.rotate(getImageRotation(player_direction));
  var Image_offset = getImageOffset(player_direction);
  context.drawImage(image, (Image_offset[0])*w, (Image_offset[1])*h, w,h);
  context.restore();
}

/**
 * Draws a corner on the context
 *
 * @param {Image} image: image to be drawn
 * @param {Array} prev_direction: the direction the player is facing before turning
 * @param {Array} curr_direction: the direction the player is facing after turning
 * @param {number} x, y, w, h: the x position, y position, width, and height of the image
 */
function drawCorner(image,context, prev_direction, curr_direction, x,y,w,h){
  var dx = prev_direction[0] - curr_direction[0];
  var dy = prev_direction[1] - curr_direction[1];
  if(dx == 1 && dy == -1){
    drawRotatedImage(image,context, [-1,0], x,y,w,h);
  }else if(dx == -1 && dy == -1){
    drawRotatedImage(image,context, [0,1], x,y,w,h);
  }else if(dx == -1 && dy == 1){
    drawRotatedImage(image,context, [1,0], x,y,w,h);
  }else if(dx == 1 && dy == 1){
    drawRotatedImage(image,context, [0,-1], x,y,w,h);
  }
}

/**
 * Gets how much an image needs to be rotated
 *
 * @param {Array} player_direction: the direction the player is facing
 * @return {number} how much the image needs to be rotated to align with player_direction
 */
function getImageRotation(player_direction){
  //can't compare by the array directly. [1,0] == [1,0] becomes false.
  if (player_direction[0] == 1)
    return Math.PI;
  else if(player_direction[1] == 1)
    return -Math.PI/2;
  else if(player_direction[0] == -1)
    return 0;
  else
    return Math.PI/2;
}

/**
 * Calculates the image ratio for the trails
 *
 * @param {Array} prev_direction: the direction the player is facing
 * @return {Array} the image ratio for the trail
 */
function getLightTrailScale(player_direction){
  if(player_direction[0] === 0)
    return [1/2, 1];
  else
    return [1, 1/2];
}

function getLightTrail(posx, posy, player_direction, player_prev_direction){
  var pos_1 = [(posx + 1/2 - 1/2*player_prev_direction[0])*BIKE_WIDTH, (posy+1/2 - 1/2*player_prev_direction[1])*BIKE_HEIGHT];
  var pos_2 = [(posx + 1/2 * player_prev_direction[0])*BIKE_WIDTH, ((posy+1/2 * player_prev_direction[1])*BIKE_HEIGHT)];
  var pos_3 = [(posx + 1/2 + 1/2*player_direction[0])*BIKE_WIDTH, (posy+1/2+1/2*player_direction[1])*BIKE_HEIGHT];
  return [pos_1,pos_2,pos_3];
}
                
//Drawing the image, rotated, at x,y is off by +- 1 in both x,y
//These numbers are to correct the offset. I don't know why they are what they are.
function getImageOffset(player_direction){
  if (player_direction[0] == 1) //(1,0,180)
    return [-1,-1];
  else if(player_direction[1] == 1) //(0,1,270)
    return [-1,0];
  else if(player_direction[0] == -1)  //(-1,0,0)
    return [0,0];
  else  //(0,-1,90)
    return [0, -1];
}

/**
 * Update the player. Move the player if it is alive. Check for
 * collision, i.e. board value is 1. Mark the board with a 1 at the
 * player coordinates.
 * @param{Object} player
 */
function update(player,players) {
  if(!game_over){
    //Move player
    if (player.alive) {
      move_bike(player);
    }
    //check for collision
    if (board[player.x][player.y] !== 0) {
      player.bike_trail.push(player.direction);
      player.alive = false;
      for(var i = 0; i < players.length; i++){
        if ((players[i].x==player.x) && (players[i].y==player.y)){
          players[i].alive = false;
        }
      }
    } else {
      // Add the direction to the bike trail
      player.bike_trail.push(player.direction);
      // Set the board value to the bike trail length
      if(player.bike_trail.length>2){
        board[player.x][player.y] = player.bike_trail.length;
      }
    }
  }
}

/*
 * Game Over. Registers the winner.
 */
function reload(){
  console.log('reload');
  BGM.play();
  //resets the board
  for (var i = 0; i < ROWS; i++) {
    board_square=[];
    for (var j = 0; j < COLS; j++) {
      board_square.push(0);
    }
    board[i]=board_square;
  }
  //Clear the canvas.
  ctx.clearRect(0, 0, ROWS*BIKE_WIDTH, COLS*BIKE_HEIGHT);
  //brings players back to life
  for (i = 0; i < NUM_PLAYERS; i++) {
    players[i].alive = true;
    players[i].bike_trail=[];
      console.log('alive');
  }
  //resets player positions
/*  HUMAN_PLAYER.x= 1;
  HUMAN_PLAYER.y= Math.floor(ROWS / 2);
  HUMAN_PLAYER.direction= [0, 1];*/
  players.forEach(function(p){
    p.x=Math.floor(Math.random()*COLS);
    p.y=Math.floor(Math.random()*ROWS);
    p.direction=PLAYER_DIRECTIONS[Math.floor(Math.random()*4)];
  });

  //resets game_over and stats_reported
  game_over=false;
  stats_reported=false;
  console.log(timer);
  if (typeof timer == 'undefined'){
    timer=setInterval(step, 1000 / FRAMES_PER_SECOND);
  }
/*  var scores=$('.playerScore');
      scores.each(function(){
        $(this).text(0);
  })*/
}

function end_game() {
  BGM.pause();
  clearInterval(timer);
  timer = undefined;
  Crash_effect.play();
  var winner = -1;
  var scoreUpdate=-1;
  // Find the winner
  for (var i = 0; i < NUM_PLAYERS; i++) {
    if (players[i].alive === true) {
      if (players[i].ai){
        var strategy=players[i].strategy;
        //updateAI(strategy);
      }
      winner = players[i].name;
      stats_reported = true;
      scoreUpdate=i;
    }
  }
  if(winner==-1){
    $('#winMessage').html('<h2>DRAW</h2>');
  }else{
    $('#winMessage').html('<h2>'+winner+' WINS!</h2>');
  }
  var scores=$('.playerScore');
  if (scoreUpdate != -1){
    var current=parseInt($(scores[scoreUpdate]).text(),10);
    $(scores[scoreUpdate]).text(current+1);
  }
  $('#winPopup').dialog({
    dialogClass: "no-close",
    resizable: false,
    height:270,
    width:540,
    modal: true,
    buttons: {
      "Play Again": function() {
        console.log('again');
        $(this).dialog('close');
        ctx.clearRect(0, 0,ROWS*BIKE_WIDTH, COLS*BIKE_HEIGHT);
        ctx.font=BIKE_WIDTH+"px Calibri";
        ctx.fillStyle='#3effff';
        ctx.fillText("Click to play",Math.floor((ROWS*BIKE_WIDTH/2)-(BIKE_WIDTH*2)),Math.floor((ROWS*BIKE_WIDTH/2)-(BIKE_WIDTH/2)));
        //reload();
      },
      "Change Mode": function() {
        $(this).dialog('close');
        location.reload();
      }
    }
  });
}

//f stands for fast.
function end_game_f(){
  var winner = -1;
  // Find the winner
  for (var i = 0; i < NUM_PLAYERS; i++) {
    if (players[i].alive === true) {
      winner = players[i].name;
      stats_reported = true;
      players[i].score = 1;
    }
  }
  stats_reported = true;
}

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
  }/*else{
    var scores=$('.playerScore');
    scores.each(function(){
      var current=parseInt($(this).text(),10);
      $(this).text(current+1);
    })
  }*/
}

//f stands for fast.
function step_f(){
  if (!stats_reported) {
    for (var i = 0; i < NUM_PLAYERS; i++) {
      if (players[i].ai) {
        move_ai(players[i]);
      }
      // Update the player
      update(players[i],players);
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
      end_game_f();
    }
  }
}

function start(){
  BGM.play();
  //Set the function which is called after each interval
  if (typeof timer == 'undefined'){
    timer=setInterval(step, 1000 / FRAMES_PER_SECOND);
  }
  //erases the text.
  ctx.clearRect(0, 0, ROWS*BIKE_WIDTH, COLS*BIKE_HEIGHT);
}

function playerSetup(){
  NUM_PLAYERS = players.length;
  players.forEach(function(p){
    p.x=Math.floor(Math.random()*COLS);
    p.y=Math.floor(Math.random()*ROWS);
    p.direction=PLAYER_DIRECTIONS[Math.floor(Math.random()*4)];
    var name = p.name;
    var color=p.COLOR;
    var label=$('<div class="playerLabel">');
    var pName=$('<span class="playerName">');
    pName.text(name+': ');
    var pScore=$('<span class="playerScore">');
    pScore.text(0);
    $(label).append(pName);
    $(label).append(pScore);
    $(label).css('color', color);
    $('#playerScores').append(label);
  });
}

//function to handle the input 'left key' on a player
//@param player the player who pressed the key

function left_key(player){
  console.log('left key');
  if(!player.direction[0]){
    player.direction = [-1,0];
  }
}

function right_key(player){
  console.log('right_key');
  if(!player.direction[0]){
    player.direction = [1,0];
  }
}

function up_key(player){
  console.log('up key');
  if(!player.direction[1]){
    player.direction = [0, -1];
  }
}

function down_key(player){
  console.log('down key');
  if(!player.direction[1]){
    player.direction = [0, 1];
  }
}

//this prevent up and down key from moving the window.
window.addEventListener("keydown", function(e) {
  // space and arrow keys
  if([37, 38, 39, 40].indexOf(e.keyCode) > -1) {
    e.preventDefault();
  }
}, false);

//TODO hardcoded to handle only HUMAN_PLAYER as the human player
//Determine the actions when a key is pressed. 
document.onkeydown = function read(event) {
  //The variable e is passed into read or a window event
  var e = event || window.event;
  //The event code
  var code = e.keyCode || e.which;
  //Check the event code
  var direction;
  if (64 < code && code < 88) {
    direction = HUMAN_PLAYER_2.direction;
    switch (code) {
      //A key
      case 65:
      //calls the corresponding key function.
        left_key(HUMAN_PLAYER_2);
        break;
      //w key
      case 87:
        up_key(HUMAN_PLAYER_2);
        break;
      //d key
      case 68:
        right_key(HUMAN_PLAYER_2);
        break;
      //s key
      case 83:
        down_key(HUMAN_PLAYER_2);
        break;
    }
  } else if (36 < code && code < 41) {
    //Current direction of HUMAN_PLAYER
    direction = HUMAN_PLAYER.direction;
    console.log("current direction is: " + direction[0] + " " + direction[1]);
    switch (code) {
      //Left arrow    
      case 37:
        //calls the corresponding key function.
        left_key(HUMAN_PLAYER);
        break;
      //up arrow
      case 38:
        e.preventDefault();
        up_key(HUMAN_PLAYER);
        break;
      //Right arrow
      case 39:
        right_key(HUMAN_PLAYER);
        break;
      //down arrow
      case 40:
        e.preventDefault();
        down_key(HUMAN_PLAYER);
        break;
    }
  }
  //N key, nyan cat
  if (code === 78){
    BGM.src = 'media/Nyan_Cat.mp3';
    red_trail.src = 'media/images/Nyan_Trail.png';
    red_bike_img.src = 'media/images/Nyan_Cat.png';
    red_corner.src = 'media/images/Nyan_Corner.png';
    BGM.play();
    $('body').css('background-image', 'url("media/images/nyan_background.gif")');
    $('body').css('background-size', '100% auto');      
  }
  //P key, pause
  if (code === 80){
    if ($('#pause').text()=='Pause'){
      BGM.pause();
      clearInterval(timer);
      timer = undefined;
      $('#pause').text('Resume')
    }else{
      BGM.play();
      timer=setInterval(step, 1000 / FRAMES_PER_SECOND);
      $('#pause').text('Pause')
    }
  }
  //SPACE key, start the game.
  if (code === 32){
    e.preventDefault();
    if(!$(".ui-dialog").is(":visible")){
      //dialog is not open, start game
      if (!started){
        start();
        started=true;
      }else if (game_over){
        reload()
      }
    }
  }
};

//AJAX functions
//function to get a random AI
//@param callback: called when the server responds, currently passed with the parsed strategy. 
//SUBJECT TO CHANGE
function getRandomAI(callback){
  $.ajax({
  url: "http://128.52.173.90/Tron/sprint_ec_openedx/EC/python/tron_adversarial_dist/get_ai_opponent.py",
})
  .done(function(data) {
    console.log(data);
    callback(JSON.parse(data));
  });
}

//function to add a AI to the DB
//@param AI: the strategy list object.
//SUBJECT TO CHANGE
function postAI(AI){
  $.ajax({
  url: "http://128.52.173.90/Tron/sprint_ec_openedx/EC/python/tron_adversarial_dist/register_results.py",
  data: {operation: 'add_AI', data: JSON.stringify(AI)}
  })
  .done(function(data){
    console.log(data);
  });
}


function updateAI(AI){
  $.ajax({
    url:"http://128.52.173.90/Tron/sprint_ec_openedx/EC/python/tron_adversarial_dist/register_results.py",
    data:{operation:'update_AI', data: JSON.stringify(AI)}
  })
  .done(function(data){
    console.log(data);
  });
}
// - Can the buttons be larger (Should the side of the board be clickable?)
// - (Can we minify and create a mobile version for the Tron)
$(function(){

  getRandomAI(addAI);
  //postAI(STRATEGIES[1])

  function addAI(data){
    STRATEGIES.push(data);
    var $option = $('<option>');
    $option.val(STRATEGIES.length - 1);
    $option.html('Evolve!');
    $('select.AI').append($option);
  }
  
  //updateAI(["IFLEQ",["IFLEQ","0.3","TURN_LEFT","SENSE_R","SENSE_A"],["+","0.3","0.3"],["IFLEQ","SENSE_R","TURN_RIGHT","TURN_RIGHT","0.6"],["+","0.1","SENSE_A"]])
  
  //Array of players
  
  STRATEGIES.forEach(function(val, index){
    var $option = $('<option>');
    $option.val(index)
    $option.html(AI_names[index + 1]);
    $('select.AI').append($option);
    //postAI(val)
  });
  
  
  skins.forEach(function(skin, index){
    var $option = $('<option>');
    $option.val(index);
    $option.html(skin.name);
    $('select.skin').append($option);
  })
  
  
  //Puts the default skin of the blue bike to be blue
  $('select.skin')[1].selectedIndex = 1;
  
  
  $('#AI1').on('change', function(){
    AI_PLAYER.strategy=STRATEGIES[$('#AI1').val()];
    $('#assignMessage').text($('#AI1 :selected').text() + ' assigned!');
    $('#assignMessage').fadeTo(600, 1.0, function(){$('#assignMessage').fadeTo(1000,0.0)});
  });

   $('#AI2').on('change', function(){
    AI_PLAYER_2.strategy=STRATEGIES[$('#AI2').val()];
    $('#assignMessage').text($('#AI2 :selected').text() + ' assigned!');
    $('#assignMessage').fadeTo(600, 1.0, function(){$('#assignMessage').fadeTo(1000,0.0)});
  });
  
  $('#red_bike_skin').on('change', function(e){
    apply_skin('red',skins[$(this).val()])
  })
  
  $('#blue_bike_skin').on('change', function(e){
    apply_skin('blue',skins[$(this).val()])
  })
  
  
  
  $('#viewStrategy1').on('click', function(){
    var strategy=STRATEGIES[$('#AI1').val()];
    prompt(strategy, JSON.stringify(strategy));
  });
  
  $('#viewStrategy2').on('click', function(){
    var strategy=STRATEGIES[$('#AI2').val()];
    prompt(strategy, JSON.stringify(strategy));
  });
  
  $('#pause').on('click', function(){
    if ($('#pause').text()=='Pause'){
      if (typeof timer != 'undefined'){
      BGM.pause();
        clearInterval(timer);
        timer=undefined;
        $('#pause').text('Resume');
      }
    }else{
      BGM.play();
      if (typeof timer == 'undefined'){
        timer=setInterval(step, 1000 / FRAMES_PER_SECOND);
      }
      $('#pause').text('Pause')
    }
  })
  
  $('#mute').on('click', function(){
    if(BGM.muted===false){
      BGM.muted=true;
      Crash_effect.muted=true;
    }else{
      BGM.muted=false;
      Crash_effect.muted=false;
    }
  });
  
  $('#about').on('click', function(){
    $('#aboutMessage').html('<b>Tron</b><br/>with AIs created by evolutionary algorithms<br/>developed by Sen Chang, Erik Hemberg, Crystal Pan, and Ray Hua Wu<br/><i><br/>Tron is the property of the Walt Disney Company.<br/>Pac-Man is the property of Namco.<br/>BubbleTanks is the property of Heroes Interactive.<br/>Pop-Tarts are the property of Kellogg\'s.<br/>Pop-Tarts give you rainbows.<br/>Potato.</i>');
    $('#aboutDialog').dialog({
      dialogClass: "no-close",
      resizable: false,
      height: 280,
      width: 540,
      modal: true,
      buttons: {
        "OK": function(){
          $(this).dialog('close');
        }
      }
    });
  });
  
  if(smaller>MOBILE_CUTOFF){
    $('#leftButton').remove();
    $('#rightButton').remove();
    $('#leftButton2').remove();
    $('#rightButton2').remove();
  }
  $('#gameChoiceMessage').html('<h2>WHICH MODE?</h2>');
  $('#gameChoice').dialog({
    dialogClass: "no-close",
    resizable: false,
    height: 240,
    width: 540,
    modal: true,
    buttons: {
      "Human vs AI": function(){
        $(this).dialog('close');
        players = [HUMAN_PLAYER, AI_PLAYER];
        AI_PLAYER.COLOR = 'blue';
        playerSetup();
        $('#leftButton2').remove();
        $('#rightButton2').remove();
        $('.AI2controls').remove();
      },
      "Human vs Human": function(){
        $(this).dialog('close');
        console.log('two');
        players = [HUMAN_PLAYER, HUMAN_PLAYER_2];
        playerSetup();
        $('.AI1controls').remove();
        $('.AI2controls').remove();
        $('#strategyChoice').remove();
      },
      "AI vs AI": function(){
        $(this).dialog('close');
        console.log('two');
        players = [AI_PLAYER, AI_PLAYER_2];
        playerSetup();
        $('#leftButton').remove();
        $('#rightButton').remove();
        $('#leftButton2').remove();
        $('#rightButton2').remove();
      }
    }
  });

  //can also use buttons to control player

  $('#leftButton').on('click', function(){
    var direction = HUMAN_PLAYER.direction;
      left(HUMAN_PLAYER);
  });
  $('#rightButton').on('click', function(){
    var direction = HUMAN_PLAYER.direction;
      right(HUMAN_PLAYER);
  });
  $('#leftButton2').on('click',function(){
    var direction = HUMAN_PLAYER_2.direction;
      left(HUMAN_PLAYER_2);
  });
  $('#rightButton2').on('click',function(){
    var direction = HUMAN_PLAYER_2.direction;
      right(HUMAN_PLAYER_2);
  });

  $('canvas').on('click', function(){
    if (!started){
      start();
      started=true;
    }else if (game_over){
      reload();
    }
  });
});

//Checks if arrays contains an obj.
function contains(array, obj) {
  for (var i = 0; i < array.length; i++) {
    if (array[i] === obj) {
      return true;
    }
  }
  return false;
}

//Seeded Random number functions
function get_random() {
  return Math.seededRandom(0, 1);
}

function get_random_int(min, max) {
  return Math.floor(Math.seededRandom(min, max));
}

function get_random_boolean() {
  return Math.seededRandom(0, 1) < 0.5;
}

// From http://indiegamr.com/generate-repeatable-random-numbers-in-js/
// the initial seed
Math.seed = 711;
Math.seededRandom = function (max, min) {
  Math.seed = (Math.seed * 9301 + 49297) % 233280;
  var rnd = Math.seed / 233280;
  return min + rnd * (max - min);
};


//Parameters Needed for AI

//Basically avoids the passing by refernce problem.
//Makes a deep copy of a tree.
//@param tree: the tree.
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

//Counts the number of nodes within a tree recursively
//@param root: the tree
//@param cnt: pass in 0 to get the right result.
function get_number_of_nodes(root, cnt) {
  cnt = cnt + 1;
  if (typeof root !== 'string') {
    for (var i = 1; i < root.length; i++) {
      cnt = get_number_of_nodes(root[i], cnt);
    }
  }
  return cnt;
}

//returns the node of a tree at target index
//@param root: the tree
//@param idx: the index of the node
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
  console.assert(idx - cnt == -1, "idx not matching cnt - 1"); // <- what's this for?
  return node;
}

//TO BE DOCUMENTED
function get_depth_from_index(node, tree_info, node_idx, depth) {

  if (node_idx == tree_info.idx) {
    tree_info.idx_depth = depth;
  }
  tree_info.idx = tree_info.idx + 1;
  for (var i = 1; i < node.length; i++) {
    tree_info = get_depth_from_index(node[i], tree_info, node_idx, depth+1);
  }
  return tree_info;
}

//replaces the a old subtree with a new subtree.
//Thanks to passing by reference, this is pretty easy.
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


//Replaces the root's node_idx tree with the subtree.
//@param root: the master tree
//@param subtree: the tree that is new
//@param node_idx: the index of the node of root to be replaced
//@idx: recursive index, PASS IN -1 to make sure it works because it's incremented at the beginning.
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


//Pool of total possible symbols
function get_symbols() {
  var arity = {
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

  var terminals = [];
  var functions = [];

  for (var key in arity) {
    if (arity.hasOwnProperty(key)) {
      if (arity[key] === 0) {
        terminals.push(key);
      } else {
        functions.push(key);
      }
    }
  }

  return {arity: arity, terminals: terminals, functions: functions};
}

var symbols = get_symbols();

//returns a random symbol
//@param depth: current depth in tree
//@param max_depth: maximum depth
//@param symbols: total possible symbols
//@param full: TO BE DOCUMENTED
function get_random_symbol(depth, max_depth, symbols, full) {
  var symbol;
  if (depth >= (max_depth - 1)) {
    symbol = symbols.terminals[get_random_int(0, symbols.terminals.length)];
  } else {
    var terminal = get_random_boolean();
    if (!full && terminal) {
      symbol = symbols.terminals[get_random_int(0, symbols.terminals.length)];
    } else {
      symbol = symbols.functions[get_random_int(0, symbols.functions.length)];
    }
  }
  return symbol;
}


//Adds a symbol to a node
//@param the tree to add the symbol to
//@param symbol: the symbol
//@param symbols: the collection of symbols, used to test if the symbol is terminal/functional.
function append_symbol(node, symbol, symbols) {
  var new_node;
  if (contains(symbols.terminals, symbol)) {
    new_node = symbol;
  } else {
    new_node = [symbol];
  }
  node.push(new_node);
  return new_node;
}


//Tries to grow a tree.
//Takes care of cases where there are no unclosed if's and +'s.
//@param tree: the tree to grow
//TO BE DOCUMENTED
function grow(tree, depth, max_depth, full, symbols) {
  var symbol;
  if (typeof tree !== 'string') {
    symbol = tree[0];
  } else {
    symbol = tree;
  }
  for (var i = 0; i < symbols.arity[symbol]; i++) {
    var new_symbol = get_random_symbol(depth, max_depth, symbols, full);
    var new_node = append_symbol(tree, new_symbol, symbols);
    var new_depth = depth + 1;
    if (contains(symbols.functions, new_symbol)) {
      grow(new_node, new_depth, max_depth, full, symbols);
    }
  }
}

var gp_params = {
    population_size: 300,
    max_size: 5,
    generations: 50,
    mutation_probability: 0.3,
    tournament_size: 2,
    crossover_probability: 0.3,
    single_thread: true
};

var evolve = new Worker('tron_evolve_worker.js');
var start_time = new Date().getTime();


//This line Below starts the clinet-side background evlolution
//Parameters are adjusted from the gp_params above
//Turn single_thread to FALSE to use multi-threaded support: faster but uses more CPU.


//evolve.postMessage(gp_params);
evolve.addEventListener('message', function(e) {
  if(gp_params.single_thread){
    show_stats(e.data);
  }else{
    evaluate_population_multi_thread(e.data.population, mutate_and_crossover, gp_params.generations);
    generation = e.data.generation;
  }
}, false);



//Delivers the data onto the screen
//@param data: object, contains a generation and a optional genome.
function show_stats(data){
  $('#currentGen').html(data.generation + ' / ' + gp_params.generations);
  if(typeof data.genome != 'undefined'){
    STRATEGIES.push(data.genome);
    var $option = $('<option>');
    $option.val(STRATEGIES.length - 1);
    $option.html('AI' + (STRATEGIES.length));
    $('select').append($option);
  }
}



function mutate_and_crossover(population, params){
  var new_population = tournament_selection(params.tournament_size, population);
  new_population = crossover(params.crossover_probability, new_population);
  mutation(params.mutation_probability, new_population, params.max_size);
  // Replace the population with the new population
  population = new_population;
  evaluate_population_multi_thread(population, mutate_and_crossover, gp_params.generations);
}

var new_population = [];
var THREADS_INITIALIZED = false;
var workers = [];
var workers_ready_status = [];
var num_workers_ready = 0;
var THREADS = 5; //optimized for AMD hexacores?
var generation = 0;
var time_prev = 0;

//multithreaded evaluate population code.
//@param population: the population to evaluate.
//@param callback: function to call after each evaluation. passed the new_population and gp_params.
//@param end_generation: the last generation.
function evaluate_population_multi_thread(population, callback, end_generation){
  num_workers_ready = 0;
  new_population = [];
  //Initialize the workers if they don't exist.
  if(!THREADS_INITIALIZED){
    for (var i = 0; i < THREADS; i++){
      var worker = new Worker('tron_evolve_worker.js');
      workers.push(worker);
      worker.finished = false;
      worker.index = i;
      workers_ready_status.push({i: false});
      worker.addEventListener('message',function(e){
        this.finished = true;
        e.data.forEach(function(val){new_population.push(val)});
        if(check_ready()){
          if(generation < end_generation){
            generation += 1;
            console.log(new_population.length);
            print_stats(generation, new_population);
            callback(new_population, gp_params);
          }else{
            workers.forEach(function(val){
              val.terminate();
            });
            var end_time = new Date().getTime();
            console.log(end_time - start_time);
            console.log('end');
          }
        }
      });
    }
    THREADS_INITIALIZED = true;
  }
  var population_len = population.length;    
  for (var i = 0; i < THREADS; i++){
    workers[i].finished = false;
    workers[i].postMessage(population.slice(population_len/THREADS*i, population_len/THREADS*(i+1)));
  }
  function check_ready(){ 
    for(var i=0; i<workers.length; i++){
      worker = workers[i];
      if (!worker.finished){
        return false;
      }
    }
    return true;
  }
}

//Main Function
//@param params: Object with keys listed above.
//Prints stats in the generations.
function gp(params) {
  console.log(params);
  // Create population
  var population = initialize_population(params.population_size,
    params.max_size);
  console.log('B initial eval');
  evaluate_fitness(population);
  console.log('A initial eval');
  // Generation loop
  var generation = 0;
  while (generation < params.generations) {
    // Selection
    var new_population = tournament_selection(params.tournament_size, population);
    new_population = crossover(params.crossover_probability, new_population);
    mutation(params.mutation_probability, new_population, params.max_size);

    // Evaluate the new population
    evaluate_fitness(new_population);

    // Replace the population with the new population
    population = new_population;

    print_stats(generation, new_population);
      
    // Increase the generation
    generation = generation + 1;
  }
}

//Initializes a Tron AI population
//@param population_size size of total # of AI's
//@param max_size Max Depth of AI's
function initialize_population(population_size, max_size) {
  var population = [];
  for (var i = 0; i < population_size; i++) {
    var full = get_random_boolean();
    var max_depth = (i % max_size) + 1;
    var symbol = get_random_symbol(1, max_depth, symbols, full);
    var tree = [symbol];
    if (max_depth > 0 && contains(symbols.functions, symbol)) {
      grow(tree, 1, max_depth, full, symbols);
    }
    population.push({genome: tree, fitness: DEFAULT_FITNESS});
    console.log(i);
    console.log(JSON.stringify(population[i].genome));
  }
  return population;
}

//Evaluates individuals' fitness 
//Loops through the population, fitness increases by one per win
//@param population: the population
function evaluate_fitness(population) {
  // Evaluate fitness
  var SOLUTIONS = 2;
  for (var i = 0; i < population.length; i += SOLUTIONS) {
    evaluate_individuals([population[i], population[i + 1]]);
  }
}

//Evaluates two individuals and compare them
//@param individuals: list of two individuals
//increments the winners' score by 1
function evaluate_individuals(individuals) {
  //Set the function which is called after each interval
  setup_tron(individuals[0].genome, individuals[1].genome);
  //TODO this is only intermittently working
  //tron_game_id = setInterval(step, 1000 / FRAMES_PER_SECOND);
  var cnt = 0;
  var BRK = ROWS*COLS; //Cannot be larger than the board
  while (!game_over && cnt < BRK) {
    step_f();
    cnt++;
  }
  individuals[0].fitness += players[0].score;
  individuals[1].fitness += players[1].score;
}


//Sets up a tron board with two AI players stradgy 0 and 1.
function setup_tron(strategy_0, strategy_1) {
//Game board. 0 is empty
  board = [];
  for (var i = 0; i < ROWS; i++) {
    var board_square = [];
    for (var j = 0; j < COLS; j++) {
      board_square.push(0);
    }
    board[i] = board_square;
  }
  var AI_PLAYER_1 = {
      name: "AI PLAYER 1",
      x:Math.floor(Math.random()*COLS),
      y:Math.floor(Math.random()*ROWS),
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
      x:Math.floor(Math.random()*COLS),
      y:Math.floor(Math.random()*ROWS),
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
  players = [AI_PLAYER_1, AI_PLAYER_2];
  NUM_PLAYERS= 2;
  game_over=false;
  stats_reported = false;
}


//Selects individuals into the tournament
//@param tournament_size: size of tournament (probably 2)
//@param population: the population of AI's
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
    var winner = competitors[0].genome;
    winner = copy_tree(winner);
    new_population.push({genome: winner, fitness: DEFAULT_FITNESS});
  }
  return new_population;
}

//Helper function to sort two individuals
//@param 2 indivduals(with fitness)
function sort_individuals(individual_0, individual_1) {
  if (individual_0.fitness < individual_1.fitness) {
    return 1;
  }
  if (individual_0.fitness > individual_1.fitness) {
    return -1;
  }
  return 0;
}

//performs crossover on the given population
//@param probablity: the chances of pairs of childrens of going through a crossover
//@param population: the changing population
//TODO: More documentation needed
function crossover(crossover_probability, population) {
  var CHILDREN = 2;
  var new_population = [];
  for (var i = 0; i < population.length; i = i + CHILDREN) {
    var children = [];
    for (var j = 0; j < CHILDREN; j++) {
      var idx = get_random_int(0, population.length);
      var genome = copy_tree(population[idx].genome);
      var child = {
        genome: genome,
        fitness: DEFAULT_FITNESS
      };
        children.push(child);
    }
    if (get_random() < crossover_probability) {
      var xo_nodes = [];
      for (var j = 0; j < children.length; j++) {
        var end_node_idx = get_number_of_nodes(children[j].genome, 0) - 1;
        var node_idx = get_random_int(0, end_node_idx);
        xo_nodes.push(get_node_at_index(children[j].genome, node_idx));
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

//Mutates a given population
//@param probablity: chance of each individual mutating
//@param new_population: the population
//@param max_size: TO BE DOCUMENTED
function mutation(mutation_probability, new_population, max_size) {
  for (var i = 0; i < new_population.length; i++) {
    // Mutate individuals
    if (get_random() < mutation_probability) {
      var end_node_idx = get_number_of_nodes(new_population[i].genome, 0) - 1;
      var node_idx = get_random_int(0, end_node_idx);
      var node_info = get_depth_from_index(new_population[i].genome, {idx_depth: 0, idx: 0}, node_idx, 0);
      var max_subtree_depth = max_size - node_info.idx_depth;
      var new_subtree = [get_random_symbol(max_subtree_depth, max_size, symbols)];
      if (contains(symbols.functions, new_subtree[0])) {
        var full = false;//get_random_boolean();
        grow(new_subtree, node_info.idx_depth, max_size, full, symbols);
      }
      find_and_replace_subtree(new_population[i].genome, new_subtree, node_idx, -1);
    }
  }
}

//This prints stats to the console.
//This is what you want to change to keep track of data.
//@param generation: the current generation number
//@param population: the population to be printed
function print_stats(generation, population) {
  population.sort(sort_individuals);
  if(generation % 10 === 0){
    show_stats({generation: generation, genome: population[0].genome});
  }else{
    show_stats({generation: generation});
  }
}