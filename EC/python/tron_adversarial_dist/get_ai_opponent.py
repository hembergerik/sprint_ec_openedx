#!/usr/bin/env python
# -*- coding: UTF-8 -*-

# enable debugging
import cgitb
#import ponyGA_coev
import random
#import database
#import run_tron_coev

cgitb.enable()

def get_random_ai_opponent():
    """Return a random ai opponent TODO fix concurrency of reading and
    writing by using a database. Maybe use Flask
    """
    population = []
    db = database.Database(run_tron_coev.DATABASE)
    population = db.get_front_individuals()
    db.close()

    opponent = random.sample(population, 1)
    ind = Individual()
    ind.from_db(opponent)
    #TODO can I make it static?
    tron_fitness = ponyGA_coev.Tron_fitness()
    code = tron_fitness.js_str(ind, opponent['id'])
    return opponent

print "Content-Type: text/plain;charset=utf-8"
print

#opponent = get_random_ai_opponent() 
opponent = 'Hellow world from server!'
print("%s"%opponent[0])

