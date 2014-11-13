#! /bin/bash

DEA_DIR=$1;
launch_data_folder=$2;
parameter_file=$3;
log_file=$4;

cd ${DEA_DIR}; 
rm -rf ${launch_data_folder}; 
tar -xf ~/${launch_data_folder}.tgz; 
bash remote_distributed_EA.sh ${parameter_file} ${log_file};
