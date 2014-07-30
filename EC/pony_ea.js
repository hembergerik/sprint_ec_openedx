/**
 * Created by erikhemberg on 7/16/14.
 */

var DEFAULT_FITNESS = 1000;

function sum(array) {
    return array.reduce(function(previous_value, current_value){
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

function evaluate_fitness(population) {
    // Evaluate fitness
    for (var i = 0; i < population.length; i++) {
        population[i]["fitness"] = sum(population[i]["genome"]);
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

function print_stats(generation, population) {
    population.sort(sort_individuals);
    var fitness_values = [];
    for (var i = 0; i < population.length; i++) {
        fitness_values.push(population[i]["fitness"]);
    }
    var ave_and_std = get_ave_and_std(fitness_values);
    console.log("Gen:" + generation + " fit_ave:" + ave_and_std[0] + "+-" +
        ave_and_std[1] + " " + population[0]["fitness"] + " " +
        population[0]["genome"]);
}

function ea(population_size, max_size, generations, mutation_probability,
            tournament_size, crossover_probability) {
    // Create population
    var population = [];
    for(var i = 0; i < population_size; i++) {
        var genome = [];
        for(var j = 0; j < max_size; j++) {
            genome.push(Math.random() < 0.5 ? 0 : 1);
        }
        population.push({genome: genome, fitness: DEFAULT_FITNESS});
        console.log(i + " Individual:" + population[i]["genome"]);
    }

    evaluate_fitness(population);

    // Generation loop
    var generation = 0;
    while (generation < generations) {
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
            competitors.sort(sort_individuals);
            // Push the best competitor to the new population
            new_population.push({genome: competitors[0]["genome"].slice(0),
                fitness: DEFAULT_FITNESS});
        }

        for (var i = 0; i < population_size; i = i+2) {
            // Crossover individuals
            if (Math.random() < crossover_probability) {
                // Pick crossover point
                var children = [];
                var idx = Math.floor(Math.random() *
                    new_population[i]["genome"].length);
                // Swap the bit strings
                children[0] = new_population[i]["genome"].slice(0, idx).
                    concat(new_population[i+1]["genome"].slice(idx));
                children[1] = new_population[i+1]["genome"].slice(0, idx).
                    concat(new_population[i]["genome"].slice(idx));
                new_population[i]["genome"] = children[0];
                new_population[i+1]["genome"] = children[1];
            }
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
    }
}

ea(population_size=40, max_size=20, generations=40, mutation_probability=0.3,
    tournament_size=2, crossover_probability=1.0);