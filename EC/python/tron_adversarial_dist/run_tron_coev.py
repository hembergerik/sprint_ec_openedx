#! /usr/bin/env python

"""Run the Tron coevolution.

NOTE deletes the database.
"""
#TODO should I do this in a shell and cron

import os
import time
import shutil
import database
import tron_v3 as tron
import tron_coev_v3 as tron_coev

DATABASE = 'tron.db'
BACKUP_SUFFIX = '.bak'
SLEEP_TIME = 1000
TIME_OUT = 100
FRONT_POPULATION = 2
GA_CONF = {
    'POPULATION_SIZE': 3,
    'MAX_SIZE': 15,
    'DEFAULT_FITNESS': 10000,
    'GENERATIONS': 1,
    'ELITE_SIZE': 1,
    'CROSSOVER_PROBABILITY': 0.9,
    'MUTATION_PROBABILITY': 0.5,
    'FITNESS_FUNCTION': None
    }
TRON_GAME_CONF = {
    'ROWS': 4,
    'BIKE_WIDTH': 4
}

def clean_up():
    os.remove(DATABASE)

def set_up():
    #Setup databases
    db = database.Database(DATABASE)
    db.drop_tables()
    db.create_tables()
    db.close()

    #Setup coevolution
    tron_fitness = tron_coev.Tron_fitness(TRON_GAME_CONF['ROWS'],
                                            TRON_GAME_CONF['BIKE_WIDTH'])
    GA_CONF['FITNESS_FUNCTION'] = tron_fitness
    ga_coev = tron_coev.GA_coev(GA_CONF['POPULATION_SIZE'],
                      GA_CONF['MAX_SIZE'], 
                      GA_CONF['DEFAULT_FITNESS'], 
                      GA_CONF['GENERATIONS'], 
                      GA_CONF['ELITE_SIZE'], 
                      GA_CONF['CROSSOVER_PROBABILITY'], 
                      GA_CONF['MUTATION_PROBABILITY'], 
                      GA_CONF['FITNESS_FUNCTION'])
    ga_coev.DATABASE = DATABASE
    return ga_coev

def update(coev):
    cnt = 0
    while cnt < TIME_OUT:
        #TODO run as a background process?
        coev.run() 
        update_dbs()
        #Delay in seconds
        time.sleep(SLEEP_TIME) 

def update_dbs():
    #Backup database
    shutil.copyfile(DATABASE, DATABASE+BACKUP_SUFFIX)

    #Update individuals with scores from human exposed opposition
    update_individuals()

    #Update human exposed opposition
    update_front_individuals()

def update_front_individuals():
    db = database.Database(DATABASE)
    #TODO theoretical possibility of an empty database
    #Truncate front
    db.truncate_front_individuals()

    #Add best from individuals to front
    individuals = db.get_AI_individuals()
    individuals.sort(key=lambda row: row['fitness'])
    for ind in individuals[:FRONT_POPULATION]:
        db.store_front_individual(ind)

    db.close()
    
def update_individuals():
    db = database.Database(DATABASE)
    front_individuals = []
    stats = db.get_tron_game_stats_and_front_individuals()
    for stat in stats:
        front_individuals.append((stat['id_individual'], 
                                          stat['individual'],
                                          stat['wins']))

    individuals = db.get_AI_individuals()
    #Adding human_exposed_individuals to individuals
    #TODO do in SQLite statements
    for he_ind in front_individuals:
        update = False
        cnt = 0
        while cnt < len(individuals) and not update:            
            if he_ind[0] == individuals[cnt]['id']:
                update = True
                #Remove found individuals to reduce loop
                del individuals[cnt]

        ind = tron.Player()
        ind.from_db(he_ind)
        if update:
            db.update_ai_individuals(he_ind, he_ind['individual_id'])
        else:
            db.store_ai_individuals(he_ind)

    db.close()

def run():
    clean_up()
    coev = set_up()
    update(coev)

def main():
    pass

if __name__ == '__main__':
    main()
