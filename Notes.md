# Inventory Scenarios

## Move object to limbo: `Obj.move_to_limbo()`
1. Remove object from parent inventory
   1. If parent is Cr:
      1. Remove (filter) object from inventory list
         - note that inventory list is `parent_cr.inv`
      1. Update Cr state (weapon equipped etc.)
   2. Else if parent is Level:
      1. Remove (filter) object from tile inventory list
         - note that inventory list is `parent_level[x][y].inv`
      2. Update object coordinates to `-1, -1`
      3. Update tile appearance
   1. Else if parent is container:
      1. *Container is NIY*

## Move limbo object to tile: `Obj.limbo_to_tile()`
1. Add object to tile inventory
   1. Push object onto tile inventory list
   1. Set object parent to Level object
1. Update object coordinates to tile `x, y`
1. Update tile appearance

## Move limbo object to Cr inventory: `Obj.limbo_to_cr()`
   1. Add object to Cr inventory
      1. Push object onto Cr inventory list
      1. Set object parent to Cr
   1. Update cr state (weapon equipped etc)

## Create new object on floor
1. Create new limbo object (Obj constructor)
1. [Move limbo object to tile](#move-limbo-object-to-tile)

## Create new object in Cr inventory
1. Create new limbo object (Obj constructor)
1. [Move limbo object to Cr inventory](#move-limbo-object-to-cr-inventory)

## Cr (incl you) picks up object from floor
   - note TBD WIP this narrative doesn't deal with object selection, assumes we already have an object selected
1. Perform "pick up" action (*will take a turn at Cr speed*)
   1. For now, peek the top object and use that
   1. [Move object to limbo](#move-object-to-limbo)
   1. [Move limbo object to Cr inventory](#move-limbo-object-to-cr-inventory)
2. Use turn

## Cr (incl you) drops object on floor
   - note TBD WIP this narrative doesn't deal with object selection, assumes we already have an object selected
1. Perform "drop" action (*will take a turn at Cr speed*)
   1. [Move object to limbo](#move-object-to-limbo)
   1. [Move limbo object to tile](#move-limbo-object-to-tile)
2. Use turn
