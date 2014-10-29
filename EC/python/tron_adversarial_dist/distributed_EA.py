#! /usr/bin/env python

import argparse
import time
import copy
import random
import sqlite3
import re
import json
import urlparse
import urllib2
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
from SocketServer import ThreadingMixIn
import threading
import cgi
import os
import logging
import sys
import multiprocessing

import yaml

import tron_coev_v3 as tron_coev_ga


__author__ = 'erikhemberg'

# TODO: Make separate database serer so Islands can connect to it

# Server from http://mafayyaz.wordpress.com/2013/02/08/writing-simple-http-server-in-python-with-rest-and-json/

FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'


def add_file_logger(logger, formatter, log_name):
    log_file_name = log_name
    file_logger = logging.FileHandler(filename=log_file_name, mode='w')
    file_logger.setLevel(logging.DEBUG)
    file_logger.setFormatter(formatter)
    logger.addHandler(file_logger)


def setup_logging():
    """Return logger.

    Setup logs using the logging library. Both file and stream logs are used.

    Returns:
     A logger with the name of the script
    """
    logger_name = os.path.basename(sys.argv[0])
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.DEBUG)
    formatter = logging.Formatter(FORMAT)

    stream_logger = logging.StreamHandler()
    stream_logger.setLevel(logging.INFO)
    stream_logger.setFormatter(formatter)
    logger.addHandler(stream_logger)

    log_name = os.path.splitext(logger_name)[0] + '.log'
    add_file_logger(logger, formatter, log_name)

    return logger

# TODO not pretty with global variable
root_logger = setup_logging()


class EAIsland(object):
    MAX_RESTARTS = 4

    def __init__(self, parameters):
        super(EAIsland, self).__init__()
        self.parameters = parameters
        self.db_name = self.parameters['database_name']
        self.db_table = self.parameters['database_table']
        self.sending_selection = self.parameters['sending_selection']
        self.send_file_name = self.parameters['send_file_name']

        # Setup database
        db = EADatabase(self.db_name)
        db.create_tables(self.db_table)
        self.port = self.parameters['port']
        self.hostname = self.parameters['hostname']
        db.store_neighbor(self.hostname, self.port, self.send_file_name)
        db.close()

        # Start server
        self.httpd = SimpleHttpServer(self.hostname, self.port)
        root_logger.info("Servin HTTP on %s" % str(self.httpd))
        self.httpd.start()
        # TODO get the threading working
        self.httpd.wait_for_thread()

        # Setup EA
        self.ea_params = self.parameters['EA_params']
        self.ea = tron_coev_ga.Tron_GA_v3(**self.ea_params)

        root_logger.info('Done setting up %s' % str(self.parameters))

    def receive(self, individuals):
        db = EADatabase(self.db_name)
        for individual in individuals:
            # TODO handle same individual (currently they are overwritten)
            db.update_individual(json.dumps(individual['genome']),
                                 json.dumps(individual['fitness']),
                                 self.db_table)

        db.close()

    def get_individuals_to_send(self):
        population = self.get_population()
        individuals = self.sending_selection(population,
                                             self.parameters['send_amplitude'])
        return individuals

    def get_one_individual(self):
        return self.get_individuals_to_send()[0]

    def send_solutions(self):
        root_logger.debug('Begin send_solutions')
        individuals = self.get_individuals_to_send()
        solutions = {'solutions': []}
        for individual in individuals:
            solutions['solutions'].append(individual)

        with open(self.send_file_name, 'w') as out_file:
            out_file.write(json.dumps(solutions))
        root_logger.info('Wrote to %s' % (self.send_file_name))

    def receive_solutions(self):
        root_logger.debug('Begin recieve_solutions')
        exporter = self.get_neighbor()
        url = "http://%s:%d/%s" % \
              (exporter['hostname'], exporter['port'],
               exporter['send_file_name'])
        try:
            root_logger.debug('Get solutions from:%s' % (url))
            response = urllib2.urlopen(url=url)
            data = response.read()
        except urllib2.URLError as err:
            root_logger.error("Error for %s" % url)
            raise urllib2.URLError(err)
        json_data = json.loads(data)
        # TODO keep from overwriting newer solutions with older collected
        self.receive(json_data['solutions'])
        root_logger.debug(json_data)
        root_logger.info('Recieved from: %s' % url)

    def get_population(self):
        db = EADatabase(self.db_name)
        population = db.get_population(self.db_table)
        db.close()
        return population

    def run_ea(self):
        population = self.get_population()
        if not population:
            population = self.ea.initialize_population()
        population = sorted(population, key=lambda x: x['fitness'],
                            reverse=True)[:self.ea.population_size]
        root_logger.info(population)
        # TODO do not keep population in memory but check point in db
        self.ea.search_loop(population)
        self.receive(self.ea.population)

    def run(self):
        # Do not POST solutions out, let clients GET solutions. No need for 
        # any dynamics, just write to files. 
        root_logger.info('Start run for %d restarts' % (EAIsland.MAX_RESTARTS))
        cnt = 0
        while cnt < EAIsland.MAX_RESTARTS:
            cnt += 1
            self.run_ea()
            root_logger.info("Restart: %d" % cnt)

            if cnt % self.parameters['send_frequency'] == 0:
                self.send_solutions()
            if cnt % self.parameters['receive_frequency'] == 0:
                try:
                    self.receive_solutions()
                except urllib2.URLError:
                    root_logger.error('Recieve error')

    def get_neighbor(self):
        db = EADatabase(self.db_name)
        neighbors = db.get_neighbors()
        db.close()
        # TODO do not receive from yourself
        neighbor = random.sample(neighbors, 1)[0]
        return neighbor

    @staticmethod
    def random_selection(population, send_amplitude):
        individuals = []
        try:
            individuals = random.sample(population, send_amplitude)
        except ValueError as err:
            root_logger.error(err)
        return individuals


class EADatabase():
    """Database for EA"""

    # TODO match these with table column names and make the tables
    #column names dictionaries thar are read in when creating tables

    WIN = 'wins'
    STAT_ID = 'id_individual'

    def __init__(self, database):
        self.connection = sqlite3.connect(database)
        #TODO does this impact performance
        self.connection.row_factory = sqlite3.Row


    @staticmethod
    def check_tablename(table):
        if not re.match('^individuals_\d+$', table):
            raise (ValueError(table))

    def create_tables(self, table):
        """Create tables for individuals and stats."""
        EADatabase.check_tablename(table)
        c = self.connection.cursor()
        query = '''CREATE TABLE IF NOT EXISTS %s
                 (id integer PRIMARY KEY,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  individual text, 
                  fitness integer)''' % (table)
        c.execute(query)
        self.connection.commit()

        # TODO add stats for sending and recieving of neighbors
        c = self.connection.cursor()
        query = '''CREATE TABLE IF NOT EXISTS neighbors
                 (id integer PRIMARY KEY,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  hostname text, 
                  port integer,
                  send_file_name text)'''
        c.execute(query)
        self.connection.commit()

    def drop_tables(self, table):
        """Remove tables for individuals and stats."""
        EADatabase.check_tablename(table)
        c = self.connection.cursor()
        query = '''DROP TABLE IF EXISTS %s''' % table
        c.execute(query)
        self.connection.commit()

    def get_population(self, table):
        EADatabase.check_tablename(table)
        c = self.connection.cursor()
        query = "SELECT individual, fitness FROM %s" % table
        c.execute(query)
        rows = c.fetchall()
        population = []
        for row in rows:
            ind = {'genome': yaml.load(str(row[0])), 'fitness': str(row[1])}
            population.append(ind)

        return population

    def get_neighbors(self):
        c = self.connection.cursor()
        query = "SELECT hostname, port, send_file_name FROM neighbors"
        c.execute(query)
        rows = c.fetchall()
        neighbors = []
        for row in rows:
            ind = {'hostname': row['hostname'], 'port': int(row['port']),
                   'send_file_name': row['send_file_name']}
            neighbors.append(ind)
        return neighbors

    def store_neighbor(self, hostname, port, send_file_name):
        c = self.connection.cursor()
        query = "INSERT INTO neighbors (hostname, port, send_file_name) VALUES(?,?,?)"
        c.execute(query, (hostname, port, send_file_name))
        self.connection.commit()

    def delete_neighbor(self, hostname, port, send_file_name):
        c = self.connection.cursor()
        query = "DELETE FROM neighbors WHERE hostname=? AND port=? AND send_file_name=?"
        c.execute(query, (hostname, port, send_file_name))
        self.connection.commit()

    def close(self):
        """Close connection."""
        self.connection.close()

    def store_individual(self, individual, fitness, table):
        """Store an individual.

        Keyword arguments:
        individual -- individual
        """
        EADatabase.check_tablename(table)
        c = self.connection.cursor()
        query = "INSERT INTO %s (individual, fitness) VALUES(?,?)" % table
        c.execute(query, (individual, fitness))
        self.connection.commit()

    def update_individual(self, individual, fitness, table):
        """Update an individual or store if it does not exist

        Keyword arguments:
        individual -- individual
        _id -- id in the individuals table
        """
        EADatabase.check_tablename(table)
        c = self.connection.cursor()
        query = "SELECT id FROM %s WHERE individual=? ORDER BY id ASC LIMIT 1" %\
                table
        c.execute(query, (individual,))
        result = c.fetchone()
        if result is None:
            self.store_individual(individual, fitness, table)
        else:
            one_id = result[0]

            query = "UPDATE %s SET fitness=? WHERE id=?" % table
            c.execute(query, (int(one_id), fitness))
            self.connection.commit()

def check_negihbor_values(data):
    regex = re.compile(
        r'^(?:http|ftp)s?://' # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|' #domain...
        r'localhost|' #localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})' # ...or ip
        r'(?::\d+)?' # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    url = 'http://%s:%s/%s' % (data['hostname'], data['port'], data['send_file_name'])
    match = regex.match(url) 
    root_logger.info('valid: %s check: %s' % (match, url))

    return match and data['send_file_name'].endswith('.json')

class HTTPRequestHandler(BaseHTTPRequestHandler):
    # TODO make a neighbor coordinator server, or

    def do_POST(self):
        root_logger.debug('Begin do_POST')
        if None != re.search('/*', self.path):
            ctype, pdict = cgi.parse_header(
                self.headers.getheader('content-type'))
            if ctype == 'application/json':
                root_logger.debug('POST json at path:' % (self.path))
                length = int(self.headers.getheader('content-length'))
                data = urlparse.parse_qs(self.rfile.read(length),
                                         keep_blank_values=1)
                record_id = self.path.split('/')[-1]
                # TODO why do I only add the key? (works for curl). Try a python adding
                data = json.loads(data.keys()[0])
                root_logger.info('Adding %s' %
                                 (str(data)))
                # TODO nice way of accessing db
                if check_negihbor_values(data) is not None:
                    db = EADatabase('EA_islands.db')
                    db.store_neighbor(data['hostname'], data['port'],
                                      data['send_file_name'])
                    db.close()
                    root_logger.info("success adding data: %s" % data)

                    self.send_response(200)
                else:
                    self.send_response(404)
                    self.send_header('Content-Type', 'application/json')
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')

        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
        
        self.end_headers()
        root_logger.debug('End do_POST')

    def do_GET(self):
        root_logger.debug('Begin do_GET at path:' % self.path)
        if re.search('/*', self.path):
            record_id = self.path.split('/')[-1]
            root_logger.debug('record_id:%s' % record_id)
            if os.path.exists(record_id):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                with open(record_id, 'r') as in_file:
                    self.wfile.write(in_file.read())

                root_logger.info('Sent %s' % record_id)
            else:
                self.send_response(400, 'Bad Request: record does not exist')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
        root_logger.debug('End do_GET')


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    allow_reuse_address = True

    def shutdown(self):
        root_logger.info('Shutting down')
        self.socket.close()
        HTTPServer.shutdown(self)
        root_logger.info('Shut down')


class SimpleHttpServer():
    def __init__(self, ip, port):
        self.server = ThreadedHTTPServer((ip, port), HTTPRequestHandler)
        self.server_thread = None

    def start(self):
        self.server_thread = threading.Thread(target=self.server.serve_forever)
        self.server_thread.daemon = True
        self.server_thread.start()

    def wait_for_thread(self):
        self.server_thread.join()

    def stop(self):
        self.server.shutdown()
        self.wait_for_thread()


def run_node(node):
    root_logger.info('Begin run_node')
    node.run()
    root_logger.info('End run_node')


def test_database():
    table = 'individuals_1'
    db = EADatabase('tron.db')
    db.drop_tables(table)
    db.create_tables(table)

    individuals = []
    ind = {'genome': [0, 0], 'fitness': 0}
    individuals.append(ind)
    ind = {'genome': [1, 1], 'fitness': 2}
    individuals.append(ind)
    ind = {'genome': [1, 1], 'fitness': 2}
    individuals.append(ind)

    for ind in individuals:
        db.store_individual(json.dumps(ind['genome']),
                            json.dumps(ind['fitness']), table)
    out = db.get_population(table)
    print('ai', out)

    individuals[0]['fitness'] = 10
    db.update_individual(json.dumps(individuals[0]['genome']), 1, table)
    db.update_individual(json.dumps([0, 0, 1]), 1, table)
    out = db.get_population(table)
    print('ai', out)
    out.sort(key=lambda row: row['fitness'], reverse=True)
    print('ai sort', out)

    db.close()


def test_ea_island(parameters):
    eai = EAIsland(parameters)
    individuals = []
    ind = {
        'genome': ["IFLEQ", ["IFLEQ", "0.3", "TURN_LEFT", "SENSE_R", "SENSE_A"],
                   ["+", "0.3", "0.3"],
                   ["IFLEQ", "SENSE_R", "TURN_RIGHT", "TURN_RIGHT", "0.6"],
                   ["+", "0.1", "SENSE_A"]],
        'fitness': 0
    }
    individuals.append(ind)
    ind = {
        'genome': ["IFLEQ", "0.3", "TURN_LEFT", "SENSE_R", "SENSE_A"],
        'fitness': 0
    }
    individuals.append(ind)
    ind = {
        'genome': ["TURN_LEFT"],
        'fitness': 0
    }
    individuals.append(ind)

    eai.receive(individuals)
    db = EADatabase(eai.db_name)
    out = db.get_population(eai.db_table)
    print('EAI', out)

    ind = eai.get_one_individual()
    print(ind)
    eai.httpd.server.shutdown()


def test_ea(parameters):
    root_logger.info('Begin test_EA')
    eai = EAIsland(parameters)

    eai.run()
    time.sleep(10)
    root_logger.info('End test_EA')


def test_multiple_local_islands():
    parameters = {
        'send_frequency': 2,
        'send_amplitude': 2,
        'sending_selection': EAIsland.random_selection,
        'database_ip': '127.0.0.1',
        'database_name': 'EA_islands.db',
        # TODO auto name
        'database_table': 'individuals_1',
        #TODO default name
        'database_neighbours_table': 'neighbours',
        'port': 8080,
        'hostname': 'localhost',
        'send_file_name': 'send_files.json',
        'receive_frequency': 2,
        'EA_params': {
            'population_size': 4,
            'max_size': 3,
            'generations': 2,
            'elite_size': 1,
            'crossover_probability': 0.9,
            'mutation_probability': 0.1,
            'fitness_function': tron_coev_ga.tron_evaluate_AIs,
        },
    }

    node_0_parameters = copy.deepcopy(parameters)
    node_0_parameters['send_file_name'] = 'send_files_0.json'
    node_0_parameters['database_table'] = 'individuals_0'

    node_1_parameters = copy.deepcopy(parameters)
    node_1_parameters['send_file_name'] = 'send_files_1.json'
    node_1_parameters['database_table'] = 'individuals_1'
    node_1_parameters['port'] = 8181

    pool = multiprocessing.Pool(processes=2)
    nodes = (node_0_parameters, node_1_parameters)
    node_objs = [EAIsland(node) for node in nodes]
    pool.map_async(run_node, node_objs)
    time.sleep(5)
    root_logger.info('Done test_multiple_local_islands')


def main(parameters):
    pass


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Distributed Evolutionary Algorithm")
    parser.add_argument('--parameter_file', type=str,
                        help='Parameters in JSON format')
    parser.add_argument('--local_test', action='store_true',
                        help='Test local setup')
    parser.add_argument('--log_file', type=str, help='Log file name')
    args = parser.parse_args()

    # Read configuration TODO change configuration file format to JSON
    # so comments can be added more easily
    parameters = None
    if args.parameter_file:
        with open(args.parameter_file, 'r') as infile:
            contents = infile.read()
            parameters = json.loads(contents)
            root_logger.info('Configuration: %s' % (parameters))

    if args.log_file:
        root_logger.handlers.remove(root_logger.handlers[-1])
        add_file_logger(root_logger, logging.Formatter(FORMAT), args.log_file)
        root_logger.info('Changing file log')

    if args.local_test:
        parameters['local_test'] = True

    return parameters


if __name__ == '__main__':
    random.seed(1)
    params = parse_arguments()
    # TODO Hack for passing functions
    if params:
        params['sending_selection'] = EAIsland.random_selection
        params['EA_params'][
            'fitness_function'] = tron_coev_ga.tron_evaluate_AIs
    if 'local_test' in params:
        test_ea(params)
        sys.exit(0)

    main(params)
    # sys.exit(0)

    #TODO default name
    #TODO auto name
    params = {
        'send_frequency': 2,
        'send_amplitude': 2,
        'sending_selection': 'EAIsland.random_selection',
        'database_ip': '127.0.0.1',
        'database_name': 'EA_islands.db',
        'database_table': 'individuals_1',
        'database_neighbours_table': 'neighbours',
        'port': 8080,
        'hostname': 'localhost',
        'send_file_name': 'send_files.json',
        'receive_frequency': 2,
        'seed': 0,
        'EA_params': {
            'population_size': 4,
            'max_size': 3,
            'generations': 2,
            'elite_size': 1,
            'crossover_probability': 0.9,
            'mutation_probability': 0.1,
            'fitness_function': 'tron_coev_ga.tron_evaluate_AIs',
        },
    }

    #test_database()
    #test_EAIsland(params)
    #test_EA(params)
# test_multiple_local_islands()
