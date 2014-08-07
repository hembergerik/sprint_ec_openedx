#!/usr/bin/env python
# -*- coding: UTF-8 -*-

# enable debugging
import cgitb
#import ponyGA_coev
import random
import database
#import run_tron_coev

cgitb.enable()

def get_random_ai_opponent():
    """Return a random ai opponent TODO fix concurrency of reading and
    writing by using a database. Maybe use Flask
    """
    population = []
    db = database.Database('tron.db')
    population = db.get_AI_individuals()
    db.close()

    opponent = random.sample(population, 1)[0]
    return opponent[2]

print "Content-Type: text/plain;charset=utf-8"
print

opponent = get_random_ai_opponent() 
print(opponent)

