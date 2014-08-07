#! /usr/bin/env python
# -*- coding: UTF-8 -*-

# enable debugging
import cgitb
import cgi
import json
import database
import run_tron_coev

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
    
print 'Content-type: text/html'
print

response = store_game_stat()

print("%s" % response)
