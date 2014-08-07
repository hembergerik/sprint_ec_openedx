#! /usr/bin/env python
# -*- coding: UTF-8 -*-

# enable debugging
import cgitb
import cgi
import json
import database
#import pony_ga
#import run_tron_coev

def store_game_stat():
    """Return a response after storing the game stat."""
    form = cgi.FieldStorage()

    game_stat = {}
    if form.has_key(database.Database.WIN):
        game_stat[database.Database.WIN] = int(form[database.Database.WIN].value)

    if form.has_key(database.Database.STAT_ID):
        game_stat[database.Database.STAT_ID] = int(form[database.Database.STAT_ID].value)

    db = database.Database(run_tron_coev.DATABASE)
    db.store_tron_game_stat(game_stat)

    db.close()

    response = json.dumps({database.Database.WIN: winner, database.Database.STAT_ID: _id})
    return response

def get_sent_data():
    form = cgi.FieldStorage()
    return form.getvalue('data')
    
    
def store_sent_data(individual):
    db = database.Database('tron.db')
    db.create_tables()
    #db.store_AI_individual('test')
    population = db.get_AI_individuals()
    db.close()
    return population
    
def get_database_data():
    db = database.Database('tron.db')
    return 'test'
    
print 'Content-type: text/html'
print

#response = store_game_stat()
response = store_sent_data('test')

print(response)
