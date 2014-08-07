#! /usr/env python

from Tkinter import *
import itertools
import sys
import datetime
import math
import copy
sys.path.append('../tron_non_adversarial/')
from tron_1p import Player, PlayerAI, TronCanvas

class Tron(object):
    """Tron game class"""

    DRAW_BOARD = False
    
    def __init__(self, rows, bike_width):
        """Constructor"""
        self.winner = -1 
        self.canvas = None
        if self.DRAW_BOARD:
            self.canvas = TronCanvas(rows, bike_width)
        self.game_over = False
        self.board = []
        for i in range(rows):
            row = []
            for j in range(rows):
                row.append(0)
            self.board.append(row)

        self.players = [
                Player(rows/2, rows/2, [0, 1], 
                       "Blue", True, 0, False, self.canvas, self.board), 
                PlayerAI(rows/2 + 3, rows/2, [0, 1], 
                       "Green", True, 1, False, self.canvas, self.board, "self.look_left(2)")]

    def step(self):
        """Function called if GUI not initialized"""
        for player in self.players:
            if isinstance(player, PlayerAI):
                self.ai_key_pressed(self.canvas, player)
        if self.game_over == False:
            for player in self.players:
                player.update()
                self.checkGameOver()
                if not player.alive:
                    self.game_over = True

    def tick(self, canvas):
        """A step_and_draw of the game. Calls itself after a DELAY.

        Keyword arguments:
        canvas -- canvas
        """
        ignore_this_timer_event = canvas.canvas.ignore_next_timer_event
        canvas.canvas.ignore_next_timer_event = False
        for player in self.players:
            if isinstance(player, PlayerAI):
                self.ai_key_pressed(canvas, player)
        if self.game_over == False and\
                ignore_this_timer_event == False:
            # only process step_and_draw if game is not over
            for player in self.players:
                player.update()
                if not player.alive:
                    self.game_over = True
            self.redraw_all(canvas)

	canvas.canvas.after(self.canvas.delay, self.tick, canvas) # pause, then call step_and_draw again

    def key_pressed(self, event):
        """Determine the action when the key is pressed. Left and
        right arrow keys moe the Player.

        Keyword arguments:
        event -- event on GUI
        """
        canvas = event.widget.canvas
        canvas.ignore_next_timer_event = True # for better timing
        # first process keys that work even if the game is over
        if (event.char == "q"):
            self.game_over = True
    
        # now process keys that only work if the game is not over
        player =  self.players[0]
        if (self.game_over == False):
            if (event.keysym == "Left"):
                    player.left()
            elif (event.keysym == "Right"):
                    player.right()
            if Tron.DRAW_BOARD:
                self.redraw_all(canvas)

    def ai_key_pressed(self, canvas, player):
        """Evaluate the strategy of the player

        Keyword arguments:
        canvas -- canvas to draw on
        player -- player which has strategy evaluated
        """
        if (self.game_over == False):
            player.evaluate_strategy()
            if Tron.DRAW_BOARD:
                self.redraw_all(canvas)
            else:
                self.checkGameOver()
    
    def checkGameOver(self):
        if self.game_over == True:
                #TODO redo setting of winner
            for player in self.players:
                print "player", player._id, player.alive
                if player.alive == True:
                    self.winner = player._id
                    print self.winner, "wins"
                text_str = self.winner, "wins"
                #print(sys._getframe().f_code.co_name, text_str)            
                f_out = open(Player.STATS_FILE, 'a')
                f_out.write('%s, %d, %d\n' % (datetime.datetime.now(), -1, self.winner))
                f_out.close()
                
    def redraw_all(self, canvas):
        """Redraw the canvas.
        
        Keyword arguments:
        canvas -- canvas to draw on
        """
        try:        
            canvas.canvas.delete(ALL)
        except TclError as e:
            print(e)
            print("TclError redraw_all")

        for player in self.players:
            if Tron.DRAW_BOARD:
                player.draw_bike()
    
        self.checkGameOver()
        if self.game_over == True:
                #TODO redo setting of winner
            text_str = self.winner, "wins"
            canvas.canvas.create_text(100, 10, text=text_str, 
                               font=("Helvetica", 12, "bold"))
            self.canvas.root.quit()

    def run(self):
        """ Return the winner after the tron game is played."""

        if Tron.DRAW_BOARD:
            self.redraw_all(self.canvas)
            # set up events
            self.canvas.root.bind("<Key>", self.key_pressed)
            self.tick(self.canvas)
            # Launch. This call BLOCKS (so your program waits until
            # you close the window)
            try:
                self.canvas.root.mainloop()  
            except:
                import traceback
                traceback.print_exc()
            #TODO correct way of cleaning up and quitting
            try:
                self.canvas.root.destroy()
            except TclError as e:
                print(e)
                print("TclError run")
        else:
            while(self.game_over==False):
                self.step()

        return self.winner


if __name__ == '__main__':
    ROWS = 32
    COLS = ROWS
    BIKE_WIDTH = 4
    BIKE_HEIGTH = BIKE_WIDTH

    #Start
    Tron.DRAW_BOARD = True
    tron = Tron(ROWS, BIKE_WIDTH)
    # Set the AI strategy
    tron.players[1].strategy = '''self.keysym = ""'''
    tron.run()
