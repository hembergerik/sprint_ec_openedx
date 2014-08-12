#! /usr/bin/env python

import sqlite3
import json
import yaml

class Database():
    """Database for Tron"""

    #TODO match these with table column names and make the tables
    #column names dictionaries thar are read in when creating tables
    
    WIN = 'wins'
    STAT_ID = 'id_individual'
    
    def __init__(self, database):
        self.connection = sqlite3.connect(database) 
        #TODO does this impact performance
        self.connection.row_factory = sqlite3.Row
               

    def create_tables(self):
        """Create tables for individuals and stats."""
        c = self.connection.cursor()
        #TODO get the keys, deletes and cascades working
        #TODO add fields for better stats (or make that an exercise)
        c.execute('''CREATE TABLE IF NOT EXISTS individuals
                 (id integer PRIMARY KEY,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  individual text, 
                  fitness integer)''')
        #Should contain copies of individuals
        c.execute('''CREATE TABLE IF NOT EXISTS front_individuals
                 (id integer PRIMARY KEY,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  individual_code_json text, 
                  individual text,
                  id_individual integer FOREGIN KEY REFERENCES individuals(id) NOT NULL,
                  UNIQUE(id_individual) ON CONFLICT REPLACE)''')
        c.execute('''CREATE TABLE IF NOT EXISTS stats
                 (id integer PRIMARY KEY,
                  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  id_individual integer FOREGIN KEY REFERENCES front_individuals(id) NOT NULL,
                  games integer DEFAULT 0, 
                  wins integer DEFAULT 0,
                  UNIQUE(id_individual) ON CONFLICT REPLACE)''')

    def drop_tables(self):
        """Remove tables for individuals and stats."""
        c = self.connection.cursor()
        c.execute('''DROP TABLE IF EXISTS individuals''')
        c.execute('''DROP TABLE IF EXISTS front_individuals''')
        c.execute('''DROP TABLE IF EXISTS stats''')
        
    def replace_population(self, new_pop):
        c=self.connection.cursor()
        c.execute('DELETE FROM individuals')
        for ind in new_pop:
            c.execute("INSERT INTO individuals (individual, fitness) VALUES(?,?)", (json.dumps(ind["genome"]), ind["fitness"]))
        self.connection.commit()
        
    def get_population(self):
        c=self.connection.cursor()
        c.execute("SELECT individual, fitness FROM individuals")
        rows=c.fetchall()
        population=[]
        for row in rows:
            ind={'genome':yaml.load(str(row[0])), 'fitness':str(row[1])}
            population.append(ind)
        return population
    
    def truncate_front_individuals(self):
        """Truncate table for front individuals."""
        c = self.connection.cursor()
        c.execute('''DELETE front_individuals''')

    def close(self):
        """Close connection."""
        self.connection.close()

    def get_tron_game_stats_and_front_individuals(self):
        c = self.connection.cursor()
        query ='''
SELECT C.id_individual, R.individual, C.wins
FROM stats AS C LEFT OUTER JOIN front_individuals AS R
ON C.id_individual = R.id
'''
        c.execute(query)
        result = c.fetchall()
        return result

    def store_AI_individual(self, individual):
        """Store an individual.

        Keyword arguments:
        individual -- individual
        """
        c = self.connection.cursor()
        query = '''
INSERT INTO individuals (individual, fitness)
  Values (test,1)
'''
        c.execute("INSERT INTO individuals (individual, fitness) VALUES(?,?)", (individual, 0))
        self.connection.commit()

    def update_AI_individual(self, individual):
        """Update an individual.

        Keyword arguments:
        individual -- individual
        _id -- id in the individuals table
        """
        c = self.connection.cursor()
        c.execute("SELECT id FROM individuals WHERE individual=? ORDER BY id ASC LIMIT 1", (individual,))
        one_id = c.fetchone()[0]

        c.execute("UPDATE individuals SET fitness=fitness+1 WHERE id=?", (int(one_id),))
        query = '''
REPLACE INTO individuals (id, individual, fitness)
  VALUES(?, ?, ?)
'''
        #[_id] + list(individual.to_db()))
        #c.execute(query, (_id, individual,1))
        self.connection.commit()

    def store_front_individual(self, individual):
        """Store an individual.

        Keyword arguments:
        individual -- individual
        """
        c = self.connection.cursor()
        query = '''
INSERT INTO front_individuals (individual, id_individual)
SELECT individual, id FROM individuals WHERE individual = ? and fitness = ?
'''
        c.execute(query, individual.to_db())
        self.connection.commit()
        
    def get_AI_by_data(self,data):
        c=self.connection.cursor()
        c.execute("SELECT * FROM individuals WHERE individual=?",(data,))
        rows=c.fetchall()
        return rows


    def get_AI_individuals(self):
        c = self.connection.cursor()
        c.execute("SELECT * FROM individuals")
        rows = c.fetchall()
        return rows

    def get_front_individuals(self):
        c = self.connection.cursor()
        #c.execute("SELECT * FROM front_individuals")
        c.execute("SELECT individual, fitness FROM individuals ORDER BY fitness DESC")
        rows = c.fetchall()
        return rows

    def get_tron_game_stats(self):
        c = self.connection.cursor()
        c.execute("SELECT * FROM stats")
        rows = c.fetchall()
        return rows

    def store_tron_game_stat(self, stat_data):
        c = self.connection.cursor()
        #TODO can get race conditions and gets a select overhead
        query = '''
SELECT games, wins FROM stats WHERE id_individual = ?
'''
        c.execute(query, (str(stat_data[STAT_ID])))
        result = c.fetchone()
        query = '''
REPLACE INTO stats (games, wins, id_individual)
  VALUES ( ?, ?, ?)
'''
        if result:
            games = int(result['games']) + 1
            wins = int(result[WIN]) + stat_data[WIN]
        else:
            games = 1
            wins = stat_data[WIN]

        c.execute(query, (games, wins, stat_data[STAT_ID]))
        self.connection.commit()

def main():
    import ponyGA_coev
    
    db = Database('tron.db')
    db.drop_tables()
    db.create_tables()

    individuals = []
    ind = ponyGA_coev.Individual([0,0])
    ind.fitness = 1
    individuals.append(ind)
    ind = ponyGA_coev.Individual([1,1])
    ind.fitness = 2
    individuals.append(ind)
    ind = ponyGA_coev.Individual([1,1])
    ind.fitness = 2
    individuals.append(ind)
    
    for ind in individuals:
        db.store_AI_individual(ind)
    out = db.get_AI_individuals()
    print('ai', out)

    db.store_front_individual(individuals[0])
    out = db.get_front_individuals()
    print('ai_vs_h', out)

    data_stats = {"wins":1, "id_individual":1}
    for _ in range(2):
        data_stats["wins"] = _
        db.store_tron_game_stat(data_stats)
        stats = db.get_tron_game_stats()
        print('stats', _, stats)
    
    print('sh', db.get_tron_game_stats_and_front_individuals())

    individuals[0].fitness = 10
    db.update_AI_individual(individuals[0], 1)
    out = db.get_AI_individuals()
    print('ai', out)
    out.sort(key=lambda row: row['fitness'], reverse=True)
    print('ai sort', out)
    
    db.close()

if __name__ == '__main__':
    main()
