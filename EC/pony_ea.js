/**
 * Created by erikhemberg on 7/16/14.
 */

var DEFAULT_FITNESS = -1000;
var WIDTH=100;
var HEIGHT=100;
var BAR_WIDTH;

/**
 * Return the sum of the values of the array
 * @param {Array.<number>} list List of numbers to sum
 * @returns {number} Sum of the array values
 */
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
    console.log("Gen:" + generation + " fit_ave:" + ave_and_std[0] + "+-" +
        ave_and_std[1] + " " + population[0]["fitness"] + " " +
        population[0]["genome"]);
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
 * @param {number} generations The number of generations
 * @param {number} mutation_probability Probability of mutating a solution
 * @param {number} tournament_size Size of competitors when selecting from the
 * old population
 */
function ea(population_size, max_size, generations, mutation_probability,
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
            if(binary==0){
                rectangle.attr("fill", "cyan");
            }else{
                rectangle.attr("fill", "magenta");
            }
        }
        population.push({genome: genome, fitness: DEFAULT_FITNESS});
        console.log(i + " Individual:" + population[i]["genome"]);
    }
    var row = d3.select('#d3chart').selectAll('g').data(population).enter().append('g').attr('transform', function(d,i){return 'translate(0,'+50*i+')'})
    
    var square = row.selectAll('rect').data(function(d){return d.genome}).enter().append('rect').attr('x', function(d,i){return 50*i}).attr('y',0)
    .attr('fill', function(d,i){if(d){ return "#ff0000" }else{
    return "#0000ff"}}).attr('width', BAR_WIDTH).attr('height', 20)


    evaluate_fitness(population);

    // Generation loop
    var generation = 0;
  
    //overloaded function step 
    //@ optional param num_steps: number of steps to proceed
    //@ optional param time: time to wait for each step, defaults to 500ms.
    function step(num_steps, time){
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

        for (var i = 0; i < population_size; i++) {
            // Mutate individuals
            if (Math.random() < mutation_probability) {
                // Pick gene
                var idx = Math.floor(Math.random() *
                    new_population[i]["genome"].length);
                // Flip the gene
                new_population[i]["genome"][idx] =
                    (new_population[i]["genome"][idx] + 1 ) % 2;
            }
        }

        // Evaluate the new population
        evaluate_fitness(new_population);

        // Replace the population with the new population
        population = new_population;

        print_stats(generation, new_population);

        // Increase the generation
        generation = generation + 1;
        
      row.data(population);
        //Allows for stepping.
        if(num_steps){
          if(time){
          setTimeout(function(){self.step(num_steps-1, time)}, time)
          }else{
          console.log('setting timeout default')
          setTimeout(function(){self.step(num_steps-1)}, 500)
          }
        }
      
    }
  this.step = step;
}


$(function(){
    var main_evolution_obj = new ea(population_size=4, max_size=20, generations=4, mutation_probability=0.3,
    tournament_size=2);
    main_evolution_obj.step(20);
})
