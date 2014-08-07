#! /usr/bin/env python
# -*- coding: UTF-8 -*-

# enable debugging
import cgitb
import cgi
import json
import database
#import ponyGA_coev
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

def get_sent(field):
    form = cgi.FieldStorage()
    return form.getvalue(field)
    

def store_AI(individual):
    db = database.Database('tron.db')
    db.store_AI_individual(individual)
    latest = db.get_AI_individuals()[-1]
    db.close()
    return latest[2]
    
def update_AI(individual, _id):
    db=database.Database('tron.db')
    db.update_AI_individual(individual, _id)
    updated=db.get_AI_individuals()[int(_id)-1]
    db.close()
    return updated

def get_database_data():
    db = database.Database('tron.db')
    return db.get_AI_individuals()
    
print 'Content-type: text/html'
print

#response = store_game_stat()
data = get_sent('data')
operation = get_sent('operation')
_id = get_sent('_id')
if operation == 'add_AI':
    stored_AI = store_AI(data)
    response = stored_AI
elif operation == 'update_AI':
    response = update_AI(data, _id)
else:
    response = 'unknown operation'
print(response)
