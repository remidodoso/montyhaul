# montyhaul

* Note: At the moment, the main branch does run, but with some glitches. Among what are probably several issues, wand animation is horked. I don't have time to deal with that right now....

<code>montyhaul</code> is a toy roguelike game implemented entirely in server-side JavaScript.

It was originally written c. 2012(?) for Firefox. ECMAScript standardization broke some things (mostly 'for each'). 
Also it was on Google Code and got archived. I finally took a little time to dig it out, fix anachronisms, and do some cleanup.
It seems to be running now.

It's not really playable but it's kind of cool to watch ... I think. I might get it to a point of "playable" in 
2022, uh make that 2023, or in 2032, or never. I'm 50-50 on the first and last options. But you can see how some of the systems
work ...

* Move around with rogue/nethack/vi-style key bindings
* Line of sight computations -- the tiles that are lit are the ones you can see
* Backing store for map and optimized screen updates
* "-more-" and pager to display messages
* You and monsters have your own speeds (24 is base speed, might make it 120, nice divisors, right?)
* Monsters will flee or follow you depending
* "Attack" with a sword (instakill)
* "Zap" with a wand -- has some animation with it
* Pick up objects
* and whatever else has been implemented since I wrote this
