#! /bin/bash

RMT_USR="ubuntu"
DEA_DIR="sprint_ec_openedx/EC/python/tron_adversarial_dist";
JSON_SFFX="json"
launch_data_folder="launch_data";

rm -rf  ${launch_data_folder}.tgz
tar -czf ${launch_data_folder}.tgz ${launch_data_folder};

for parameter_file in $( find $1 -name "node*parameters.${JSON_SFFX}" ); do
    hostname=$( grep -Po '"hostname":\s*"?.+?"' ${parameter_file} | cut -d':' -f 2 | tr -d ' ' | tr -d '"');
    log_file=$( basename ${parameter_file} ${JSON_SFFX} )log

    # TODO remove quanta ssh alias
    #scp -i ~/erik.pem ${launch_data_folder}.tgz; ${RMT_USR}@${hostname}:${DEA_DIR}/.;
    #sshq ${hostname} 'cd ${DEA_DIR}; rm -rf ${launch_data_folder}; tar -xf ${launch_data_folder}.tgz; bash remote_distributed_EA.sh ${parameter_file} ${log_file}';
done

