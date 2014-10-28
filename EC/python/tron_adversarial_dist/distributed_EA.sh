#! /bin/bash

#Test distributed_EA.py

rm pid.log

python distributed_EA.py --parameter_file node_0_parameters.json --local_test --log_file node_0.log &
pid=$!
echo ${pid}
echo ${pid} >> pid.log

python distributed_EA.py --parameter_file node_1_parameters.json --local_test --log_file node_1.log &
pid=$!
echo ${pid}
echo ${pid} >> pid.log
