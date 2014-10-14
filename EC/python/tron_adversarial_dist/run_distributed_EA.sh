#! /usr/bin/bash

python distributed_EA.py &
pid=$!
echo ${pid}
echo ${pid} > pid.log
#sleep 1
#wget http://localhost:8080/send_files.json
