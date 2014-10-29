#! /usr/bin/bash

python distributed_EA.py --parameter_file node_0_parameters.json --local_test &
pid=$!
echo ${pid}
echo ${pid} > pid.log
#sleep 1
#wget http://localhost:8080/send_files.json
