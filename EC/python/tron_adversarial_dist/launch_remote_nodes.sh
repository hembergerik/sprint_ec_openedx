#! /bin/bash

parameter_dir=$1;
RMT_USR="ubuntu";
DEA_DIR="sprint_ec_openedx/EC/python/tron_adversarial_dist";
JSON_SFFX="json";
launch_data_folder="launch_data";

rm -rf  ${launch_data_folder}.tgz
tar -czf ${launch_data_folder}.tgz ${launch_data_folder};

for parameter_file in $( find ${parameter_dir} -name "node*parameters.${JSON_SFFX}" ); do
    hostname=$( grep -Po '"hostname":\s*"?.+?"' ${parameter_file} | cut -d':' -f 2 | tr -d ' ' | tr -d '"');
    log_file=$( basename ${parameter_file} ${JSON_SFFX} )log

    # TODO remove quanta ssh alias
    scp -i ~/erik.pem ${launch_data_folder}.tgz ${RMT_USR}@${hostname}:.;
    ssh -oStrictHostKeyChecking=no -oCheckHostIP=no -i ~/erik.pem -l ubuntu ${hostname} 'bash -s' < execute_DEA.sh ${DEA_DIR} ${launch_data_folder} ${parameter_file} ${log_file};
done

