import pony_gp
import random


def count_nodes(node, terminals, functions, symbols):
    if node[0] in symbols["terminals"]:
        terminals += 1
    elif node[0] in symbols["functions"]:
        functions += 1
    else:
        raise (node)
    for child in node[1:]:
        terminals, functions = count_nodes(child, terminals, functions, symbols)
    return terminals, functions

symbols = pony_gp.get_symbols()
args = pony_gp.parse_arguments()
seed = args.seed
test_train_split = args.test_train_split
fitness_cases_file = args.fitness_cases

test, train = pony_gp.get_test_and_train_data(fitness_cases_file,
                                              test_train_split)
param = vars(args)
param["symbols"] = symbols
param["fitness_cases"] = train["fitness_cases"]
param["targets"] = train["targets"]

for i in range(100):
    random.seed(i)
    bff = pony_gp.run(param)
    print(str(i) + " Best train:" + str(bff))
    # Test on out-of-sample data
    pony_gp.out_of_sample_test(bff, test["fitness_cases"], test["targets"],
                               param["symbols"])
    terminals, functions = count_nodes(bff["genome"], 0, 0, symbols)
    assert (terminals - functions) == 1