#! /bin/bash

#Test distributed_EA.py with remote machines

parameter_file=$1
log_file=$2
neighbor_file=$3

# Find key-value in json file without parsing
# TODO use a more correct parser (or a different file fromat than json)
port=$( grep -Po '"port":\s*"?\d+"?' ${parameter_file} | cut -d':' -f 2 | tr -d ' ')
hostname=$( grep -Po '"hostname":\s*"?.+?"' ${parameter_file} | cut -d':' -f 2 | tr -d ' ' | tr -d '"')

rm pid.log

python distributed_EA.py --parameter_file ${parameter_file} --local_test --log_file ${log_file} &
pid=$!
echo ${pid} >> pid.log
sleep 2
curl -X POST -H "Accept: application/json" -H 'Content-Type: application/json' -d "$( cat ${neighbor_file} )" http://${hostname}:${port}
