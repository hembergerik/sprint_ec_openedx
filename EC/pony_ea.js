/**
 * Created by erikhemberg on 7/16/14.
 */

var DEFAULT_FITNESS = -1000;
var WIDTH=100;
var HEIGHT=100;
var BAR_WIDTH;

var ONE_COLOR = '#33efef';
var ZERO_COLOR = '#ef9999';
var MUTATE_ONE_COLOR = '#0000ff'
var MUTATE_ZERO_COLOR = '#ff0000'
var colors = [ZERO_COLOR, ONE_COLOR,MUTATE_ONE_COLOR, MUTATE_ZERO_COLOR]

var CELL_WIDTH = 30;
var CELL_HEIGHT = 30;
var CELL_MARGIN = 2;
/**
 * Return the sum of the values of the array
 * @param {Array.<number>} list List of numbers to sum
 * @returns {number} Sum of the array values
 */

function round(number,placesBeyondDecimal){
    var mult = Math.pow(10,placesBeyondDecimal);
    return Math.round(number*mult)/mult;
}

function sum(list) {
    return list.reduce(function(previous_value, current_value){
        return previous_value + current_value;
    });
}

/**
 * Return [-1,0,1] to indicate if an individual has a lower fitness value
 * @param {Object} individual_0 One individual to compare
 * @param {Object} individual_1 Another individual to compare
 * @returns {number} Whether the fitness is lower
 */
function compare_individuals(individual_0, individual_1) {
    if (individual_0["fitness"] < individual_1["fitness"]) {
        return 1;
    }
    if (individual_0["fitness"] > individual_1["fitness"]) {
        return -1;
    }
    return 0;
}

/**
 * Assign fitness to each element(Individual) in the population by calling the fitness
 * function. The fitness function is the sum of the bit string(genome) of the
 * Individual.
 * @param {Array.<Object>}population
 */
function evaluate_fitness(population) {
    // Evaluate fitness
    for (var i = 0; i < population.length; i++) {
        population[i]["fitness"] = sum(population[i]["genome"]);
    }
}

/**
 * Return the average and standard deviation of a list of values
 * @param {Array.<number>} values List of values
 * @returns {Array.<number>} List with Average and Standard Deviation
 */
function get_ave_and_std(values) {
    var ave = sum(values) / values.length;
    var std = 0;
    for (var i = 0; i < values.length; i++) {
        std += Math.pow(values[i]-ave , 2);
    }
    std = Math.sqrt(std / values.length);
    return [ave, std];
}

/**
 * Write the statistics of the population to the console. The statistics are
 * generation number, average fitness and standard deviation of fitness in the
 * population and the fitness of the top solution and its bit string(genome)
 * @param {number} generation The generation number
 * @param {Array.<Object>} population The population of the current generation
 */
function print_stats(generation, population) {
    population.sort(compare_individuals);
    var fitness_values = [];
    for (var i = 0; i < population.length; i++) {
        fitness_values.push(population[i]["fitness"]);
    }
    var ave_and_std = get_ave_and_std(fitness_values);
    console.log("Gen:" + generation + " fit_avg:" + round(ave_and_std[0],3) + "+-" +
        round(ave_and_std[1],3) + " " + population[0]["fitness"] + " " +
        population[0]["genome"]);
        $('#info').html("<b>Generation: </b>" + generation + " <br><b>AVG: </b>" + ave_and_std[0].toFixed(2) + "<br><b>SD: </b>" +
        ave_and_std[1].toFixed(2) + "<br><b>Highest Fitness: </b>" + population[0]["fitness"])
}

/**
 * The evolutionary algorithm, performs a stochastic parallel
 iterative search. The algorithm:

 - Generate a population of initial solutions
 - Iterate a fixed number of times

 - Evaluate the fitness of the new solutions
 - Select solutions for a new population
 - Vary the solutions in the new population

 - Mutate a solution

 - Replace the old population with the new population

 The data fields are:

 - Individual, a list:

 - Genome, an integer list for representing a bit string
 - Fitness, an integer for the fitness value

 - Population, a list of individuals

 * @param {number} population_size Integer for population size
 * @param {number} max_size The maximum size of an individual
 * @param {number} mutation_probability Probability of mutating a solution
 * @param {number} tournament_size Size of competitors when selecting from the
 * old population
 */
function ea(population_size, max_size, mutation_probability,
            tournament_size) {
    
    var self = this;
    // Create population
    BAR_WIDTH=WIDTH/max_size;
    var population = [];
    
    
    
    for(var i = 0; i < population_size; i++) {
        var svgContainer = d3.select("body")
                             .append("svg")
                             .attr("width",  WIDTH+20)
                             .attr("height", HEIGHT);
        var genome = [];
        for(var j = 0; j < max_size; j++) {
            var binary=(Math.random() < 0.5 ? 0 : 1)
            genome.push(binary);
            var rectangle = svgContainer.append("rect")
                                        .attr("x", BAR_WIDTH*j)
                                        .attr("y", 0)
                                        .attr("width", BAR_WIDTH)
                                        .attr("height", HEIGHT);
                rectangle.attr("fill", colors[binary]);
        }
        population.push({genome: genome, fitness: DEFAULT_FITNESS});
        console.log(i + " Individual:" + population[i]["genome"]);
    }
    
    var main_chart = d3.select('#d3chart')
    main_chart.attr('width', (CELL_WIDTH+CELL_MARGIN)*max_size)
              .attr('height', (CELL_HEIGHT+CELL_MARGIN)*population_size);
    var rows = d3.select('#d3chart')
                 .selectAll('g')
                 .data(population)
                 .enter()
                 .append('g')
              .attr('transform', function(d,i){return 'translate(0,'+(CELL_WIDTH+CELL_MARGIN)*i+')'})
    var row = rows.selectAll('rect').data(function(d){return d.genome})
    row.enter();
    var square = row.enter().append('rect').attr('x', function(d,i){return (CELL_WIDTH+CELL_MARGIN)*i}).attr('y',0)
    .attr('fill', function(d,i){return colors[d]}).attr('width', CELL_WIDTH).attr('height', CELL_HEIGHT)


    evaluate_fitness(population);

    // Generation loop
    var generation = 0;
    
    function update_graph(population){
        //All of below are needed to update the d3 graph.
        rows.data(population);
        row.data(function(d){return d.genome})
        square.attr('fill', function(d,i){return colors[d]})
    }
  
    //overloaded function step 
    //@ optional param num_steps: number of steps to proceed
    //@ optional param time: time to wait for each step, defaults to 500ms.
    //@ optional param mutate_time: time to wait for each mutation. if not provided, mutation will not be animated.
    //uses recursive set interval looping. conflicts with the set interval looping of contained function mutate_individual,
    //which causes unpredicted behavior
    function step(num_steps, time, mutate_time){
    // Selection
        var new_population = [];
        while (new_population.length < population_size) {
            var competitors = [];
            // Randomly select competitors for the tournament
            for (var i = 0; i < tournament_size; i++) {
                var idx = Math.floor(Math.random() * population_size);
                competitors.push(population[idx]);
            }
            // Sort the competitors by fitness
            competitors.sort(compare_individuals);
            // Push the best competitor to the new population
            new_population.push({genome: competitors[0]["genome"].slice(0),
                fitness: DEFAULT_FITNESS});
        }
        

        if(mutate_time){
            console.log(mutate_time)
            mutate_individual_r(0, mutate_time);
        }else{
          for (var i = 0; i < population_size; i++) {
            mutate_individual(i)
          }
        }
       // Mutate individuals
        function mutate_individual(i){
          if (Math.random() < mutation_probability) {
                  // Pick gene
                  var idx = Math.floor(Math.random() *
                      new_population[i]["genome"].length);
                  // Flip the gene
                  new_population[i]["genome"][idx] =
                      (new_population[i]["genome"][idx] + 1 ) % 2;
              }
        }
        //this one is recursive and have a delay
        //allows for the graph to update.
        function mutate_individual_r(index, delay){ 
          if(index == 0){
            $('g:last-of-type').css('stroke', 'none')
          }
          var g_index = index+1;
          $('g:nth-of-type('+g_index+')').css('stroke', 'yellow');
          $('g:nth-of-type('+index+')').css('stroke', 'none')
          console.log(index)
          mutate_individual(index);
          update_graph(new_population);
          if(index < population_size - 1){
          setTimeout(function(){self.mutate_individual_r(index+1, delay)}, delay)
          }
        }
        this.mutate_individual_r = mutate_individual_r

        // Evaluate the new population
        evaluate_fitness(new_population);

        // Replace the population with the new population
        population = new_population;

        print_stats(generation, new_population);

        // Increase the generation
        generation = generation + 1;
        
        update_graph(population);

        //Allows for stepping.
        if(num_steps){
          if(time){
          setTimeout(function(){self.step(num_steps-1, time, mutate_time)}, time)
          }else{
          setTimeout(function(){self.step(num_steps-1, null, mutate_time)}, 300)
          }
        }
      
    }
  this.step = step;
}


$(function(){
    var main_evolution_obj = new ea(population_size=15, max_size=20, mutation_probability=0.3,
    tournament_size=2);
    main_evolution_obj.step(50,5000,300);
})
