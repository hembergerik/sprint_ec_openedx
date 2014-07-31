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
NEGATIVE_COLOR='#999999'
var colors = [ZERO_COLOR, ONE_COLOR,MUTATE_ONE_COLOR, MUTATE_ZERO_COLOR]

var CELL_WIDTH = 30;
var CELL_HEIGHT = 30;
var CELL_MARGIN = 2;

var NUM_STEPS_DEFAULT = 2;
var TIME_DEFAULT = 500;
var COMPUTATION_TIME_DEFAULT = 100;
var FIGHT_TIME_DEFAULT=300;
var MUTATE_TIME_DEFAULT = 300;

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
        var genome = [];
        for(var j = 0; j < max_size; j++) {
            var binary=(Math.random() < 0.5 ? 0 : 1)
            genome.push(binary);
        }
        population.push({genome: genome, fitness: DEFAULT_FITNESS});
        console.log(i + " Individual:" + population[i]["genome"]);
    }
    
    var main_chart = d3.select('#d3chart')
    main_chart.attr('width', (CELL_WIDTH+CELL_MARGIN)*max_size+20)
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

    var winner_chart = d3.select('#winners')
    winner_chart.attr('width', (CELL_WIDTH+CELL_MARGIN)*max_size)
              .attr('height', (CELL_HEIGHT+CELL_MARGIN)*population_size);
    var wrows = d3.select('#winners')
                 .selectAll('g')
                 .data(population)
                 .enter()
                 .append('g')
              .attr('transform', function(d,i){return 'translate(0,'+(CELL_WIDTH+CELL_MARGIN)*i+')'})
    var wrow = wrows.selectAll('rect').data(function(d){return d.genome})
    wrow.enter();
    var wsquare = wrow.enter().append('rect').attr('x', function(d,i){return (CELL_WIDTH+CELL_MARGIN)*i}).attr('y',0)
    .attr('fill', NEGATIVE_COLOR).attr('width', CELL_WIDTH).attr('height', CELL_HEIGHT)

    evaluate_fitness(population);

    // Generation loop
    var generation = 0;
    
    function update_graph(population){
        //All of below are needed to update the d3 graph.
        rows.data(population);
        row.data(function(d){return d.genome})
        square.transition().attr('fill', function(d,i){return colors[d]})
      }

    function update_winners(population){
        //All of below are needed to update the d3 graph.
        wrows.data(population);
        wrow.data(function(d){return d.genome})
        wsquare.attr('fill', function(d,i){if(d<0){return NEGATIVE_COLOR}else{return colors[d]}})
    }

    function clear_winners(population){
        $('#d3chart g').each(function(){
            var ctran=$(this).attr('transform').slice(10);
            var translation=[];
            ctran.substring(0, ctran.length-1).split(',').forEach(function(n){
                translation.push(parseInt(n,10));
            })
            $(this).attr('transform', 'translate('+0+','+translation[1]+')')
        })
        wrows.data(population);
        wrow.data(function(d){return d.genome})
        wsquare.attr('fill', function(d,i){return NEGATIVE_COLOR}) 
    }

    function fight(pop,index) {
        var competitors = select_competitors(population)
        // Sort the competitors by fitness
        competitors.sort(compare_individuals);
        // Push the best competitor to the new population
        pop[index]={genome: competitors[0]["genome"].slice(0),
            fitness: DEFAULT_FITNESS};
    }

    function fight_r(pop, delay, callback, graph_function, index){
      var index = index || 0;
      $('#d3chart g').each(function(){
            var ctran=$(this).attr('transform').slice(10);
            var translation=[];
            ctran.substring(0, ctran.length-1).split(',').forEach(function(n){
                translation.push(parseInt(n,10));
            })
            $(this).attr('transform', 'translate('+0+','+translation[1]+')')
      })
      fight(pop,index);
      graph_function(pop);
      if(index < population.length - 1){
        setTimeout(function(){self.fight_r(pop, delay, callback, graph_function, index + 1)}, delay);
      }else{
        setTimeout(function(){
          clear_winners(pop);
          callback();}
          ,delay);
      }
    }
    
    
    //Mutates one individual
    //@param individual: object individual to be mutated
    //passing by reference makes returning the individual unecessary.
    //@returns the index of the gene mutated + 1, or false.
    //why +1? +1 allows to do if(idx); also reduces the work when flipping the bit.
    function mutate_individual(individual){
      if (Math.random() < mutation_probability) {
          var idx = Math.floor(Math.random() *
              individual["genome"].length);
          // Flip the gene
          individual["genome"][idx] =
              (individual["genome"][idx] + 1 ) % 2;
          return idx+1;
      }
      return false;
    }
  
  
    //recursively mutates all the individuals in the population
    //@param population: population object
    //@param delay: delay for each loop
    //@param callback: function called after the entire population is mutated.
    //@param graph_function: function called each iteration to update the graph. graph_function is passed the index, population, and the index of gene mutated(or false)
    //@internal param index: the ith individual to mutate.
    function mutate_individual_r(population,delay, callback,graph_function, index){
      var index = index || 0;
      var mutate_gene_index = mutate_individual(population[index])
      graph_function(index, population, mutate_gene_index);
      if(index < population.length - 1){
        setTimeout(function(){self.mutate_individual_r(population, delay, callback, graph_function, index + 1)}, delay)
      }else{
        callback();
      }
    }
    this.mutate_individual_r = mutate_individual_r;
    this.fight_r=fight_r;
    
    //select tournament_size individuals to an array
    //@param population: the population object
    //@return competitors: an array of individuals in the competition
    function select_competitors(population){
        var competitors = [];
        for (var i = 0; i < tournament_size; i++) {
            var idx = Math.floor(Math.random() * population.length);
            competitors.push(population[idx]);
            var highlight=idx+1;
            var ctran=$('#d3chart g:nth-of-type('+highlight+')').attr('transform').slice(10);
            var translation=[];
            ctran.substring(0, ctran.length-1).split(',').forEach(function(n){
                translation.push(parseInt(n,10));
            })
            $('#d3chart g:nth-of-type('+highlight+')').attr('transform', 'translate('+20+','+translation[1]+')')
        }
        return competitors
  }
    //flips the rect 180 degreens along the Z-position.
    //purely for the sake of looking good.
    //@param $rect the jquery rect object.
    //@internal_param deg the current degreens of the transition.
  
    function flip_rect_bit($rect, deg){
      deg = deg || 0;
      $rect.css('transform', 'rotateY(' + deg +'DEG)')
      $rect.css('transform-origin', (parseInt($rect.attr('x')) + CELL_WIDTH/2) + 'px')
      if(deg < 180){
        setTimeout(function(){self.flip_rect_bit($rect, deg+2)}, 5)
      }
    }
    this.flip_rect_bit = flip_rect_bit;

    

    //overloaded function step 
    //@ optional param num_steps: number of steps to proceed. defaults to one.
    //@ optional param time: time to wait for each step, defaults to 500ms.
    //@ optional param mutate_time: time to wait for each mutation. defaults to 0.
    //@ optional param competition_time: time to wait for each competition. defaults to 0.
    function step(num_steps, time, competition_time, mutate_time, fight_time){
    // Selection
        var new_population = [];
        for(var i = 0; i < population_size; i++) {
          var genome = [];
          for(var j = 0; j < max_size; j++) {
              genome.push(-1);
          }
          new_population.push({genome: genome, fitness: DEFAULT_FITNESS});
        }
        
        if (fight_time){
          fight_r(new_population,fight_time, mutate, update_winners);
        }else{
          for (var i=0; i < population_size; i++){
            fight(new_population);
          }
        }

        function mutate(){
          if(mutate_time){
              mutate_individual_r(new_population, mutate_time, finalize, mutate_graph)
          }else{
            for (var i = 0; i < population_size; i++) {
              new_population[i] = mutate_individual(new_population[i])
            }
          }
        }
        //mutate();
      
      function mutate_graph(index, population, mutate_gene_index){
        if(index == 0){
            $('g:last-of-type').css('stroke', 'none')
        }
          var g_index = index+1;
          $('#d3chart g:nth-of-type('+g_index+')').css('stroke', '#000');
          $('#d3chart g:nth-of-type('+index+')').css('stroke', 'none');
          update_graph(population)
          if(mutate_gene_index){
              flip_rect_bit($('#d3chart g:nth-of-type('+g_index+') rect:nth-of-type('+ mutate_gene_index +')'))
            }
          }
        
        function finalize(){
        
          //update_graph(population);
          // Evaluate the new population
          evaluate_fitness(new_population);

          // Replace the population with the new population
          population = new_population;

          print_stats(generation, new_population);

          // Increase the generation
          generation = generation + 1;


          //Allows for stepping.
          if(num_steps){
            if(time){
              setTimeout(function(){self.step(num_steps-1, time, competition_time, mutate_time,fight_time)}, time);
            }else{
              setTimeout(function(){self.step(num_steps-1, null,competition_time, mutate_time, fight_time)}, MUTATE_TIME_DEFAULT);
            }
          }
        }
    }
  this.step = step;
}

$(function(){
    var main_evolution_obj = new ea(population_size=10, max_size=5, mutation_probability=0.3,
    tournament_size=2);
    main_evolution_obj.step(NUM_STEPS_DEFAULT,TIME_DEFAULT,COMPUTATION_TIME_DEFAULT,MUTATE_TIME_DEFAULT, FIGHT_TIME_DEFAULT);

})