#!/usr/bin/env python
# -*- coding: UTF-8 -*-
#Recreate Tron game
#Recreate Evaluate individual function from js
#This is non-graphcial and AI only.


import math
import random


class Tron(object):
    def __init__(self, rows, AI_1, AI_2):
        """Constructor"""
        self.winner = -1 
        self.game_over = False
        self.board = []
        
        #boards array of 20*20, 0 denotes empty
        # 1 denotes trail.
        for i in range(rows):
            row = []
            for j in range(rows):
                row.append(0)
            self.board.append(row)
        self.player1 = Player(random.randint(0, rows),random.randint(0, rows),AI_1, self.board)
        self.player2 = Player(random.randint(0, rows),random.randint(0, rows),AI_2, self.board)


    def step(self):
        self.player1.move()
        self.player2.move()
        self.checkGameOver()
            
            
    def checkGameOver(self):
        if self.player1.alive and self.player2.alive:
            return False
        else:
            return True
    
    def run(self):
        while(not self.checkGameOver()):
            self.step()
        if self.player1.alive:
            return 0
        else:
            return 1
            
    
    
class Player(object):
    def __init__(self,x,y,strategy,board):
        self.strategy = strategy
        self.board = board
        self.alive = True
        self.bike_trail = []
        self.x = x
        self.y = y
        self.PLAYER_DIRECTIONS = [[0, 1],[1, 0],[0, -1],[-1, 0]];
        self.direction = self.PLAYER_DIRECTIONS[0]
        
        
     
    #changes the player's direction to the right
    def right(self):
        direction_idx = self.PLAYER_DIRECTIONS.index(self.direction)
        new_direction_idx = (direction_idx + len(self.PLAYER_DIRECTIONS) - 1) % len(self.PLAYER_DIRECTIONS);
        self.direction = self.PLAYER_DIRECTIONS[new_direction_idx];
        
        
    #changes the player's direction to the left
    def left(self):
        direction_idx = self.PLAYER_DIRECTIONS.index(self.direction)
        new_direction_idx = (direction_idx + len(self.PLAYER_DIRECTIONS) + 1) % len(self.PLAYER_DIRECTIONS);
        self.direction = self.PLAYER_DIRECTIONS[new_direction_idx];
    
    
    #finds the distacne to obstacle in target direction
    #direction: -1: right; 0: front; 1: left;
    #returns a float representing the percentage.
    def distance(self, direction):
        direction_idx = self.PLAYER_DIRECTIONS.index(self.direction)
        new_direction_idx = (direction_idx + len(self.PLAYER_DIRECTIONS) + direction) % len(self.PLAYER_DIRECTIONS);
        new_direction = self.PLAYER_DIRECTIONS[new_direction_idx];
        current_x = (self.x + new_direction[0]) % len(self.board)
        current_y = (self.y + new_direction[1]) % len(self.board)
        distance = 0
        while(self.board[current_x][current_y] == 0 and distance < len(self.board)-1):
            current_x += new_direction[0]
            current_y += new_direction[1]
            current_x %= len(self.board)
            current_y %= len(self.board)
            distance += 1
        return distance/float(len(self.board))
        
        
        
    
    def move(self):
        self.evaluate(self.strategy)
        self.x += self.direction[0]
        self.y += self.direction[1]
        self.x %= len(self.board)
        self.y %= len(self.board)
        if self.board[self.x][self.y] != 0:
            self.alive = False;
        self.board[self.x][self.y] = 1
    
    
    def evaluate(self, strategy):
        if (type(strategy) is str):
            symbol = strategy
        else:
            symbol = strategy[0]
        if(symbol == "IFLEQ"):
            if (self.evaluate(strategy[1]) <= self.evaluate(strategy[2])):
                return self.evaluate(strategy[3])
            else:
                return self.evaluate(strategy[4])
        elif(symbol == "SENSE_A"):
            return self.distance(0)
        elif(symbol == "SENSE_L"):
            return self.distance(1)
        elif(symbol == "SENSE_R"):
            return self.distance(-1)
        elif(symbol == "TURN_LEFT"):
            self.left()
            return float('nan')
        elif(symbol == "TURN_RIGHT"):
            self.right()
            return float('nan')
        elif(symbol == "+"):
            
            #This is to maintain consitency with the JS code
            #In js, 5 + undefined is NaN, where as python throws an error.
            #NaN is false when compared to anything, which is somewhat useful.

            left = self.evaluate(strategy[1])
            right = self.evaluate(strategy[2])
            if left == None or right == None:
                return float('nan')
            else:
                return left + right
        elif(symbol == "-"):
            left = self.evaluate(strategy[1])
            right = self.evaluate(strategy[2])
            if left == None or right == None:
                return float('nan')
            else:
                return left - right
        elif(symbol == "0.1"):
            return float(symbol)
        elif(symbol == "0.3"):
            return float(symbol)
        elif(symbol == "0.6"):
            return float(symbol)
        else:
            pass
            #raise an error
            
#Testing code.
            
t = Tron(20, ["IFLEQ",["IFLEQ",["TURN_LEFT"],["+","0.3","0.3"],["IFLEQ","SENSE_R","TURN_RIGHT","TURN_RIGHT","0.6"],["+","0.1","SENSE_A"]],["+","0.3","0.3"],["IFLEQ","SENSE_R","TURN_RIGHT","TURN_RIGHT","0.6"],["+","0.1","SENSE_A"]], ["IFLEQ",["IFLEQ",["TURN_LEFT"],["+","0.3","0.3"],["IFLEQ","SENSE_R","TURN_RIGHT","TURN_RIGHT","0.6"],["+","0.1","SENSE_A"]],["+","0.3","0.3"],["IFLEQ","SENSE_R","TURN_RIGHT","TURN_RIGHT","0.6"],["+","0.1","SENSE_A"]])
#t = Tron(20, ["-",["-",["0.3"],["IFLEQ",["IFLEQ","0.3","SENSE_L","0.6","TURN_RIGHT"],["-","0.3","SENSE_L"],["-","0.3","0.1"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]]],["IFLEQ",["-",["+","0.3","0.1"],["IFLEQ","0.1","0.3","SENSE_R","TURN_RIGHT"]],["-","0.3","SENSE_L"],["+","0.1","TURN_RIGHT"],["IFLEQ","SENSE_A","SENSE_L","TURN_LEFT","0.1"]]], ['0.3'])
t.run()
            
            
            
            
            
            
            
            
            