# Concisus – Callsigns

Nov 22, 2026 · @Dan

**Draft — not final.** Callsign lists and the attribute ranges and deeds that assign them. How the system works is described under Soldiers & progression in the [Game Design Document](https://claude.ai/artifact/EntHEaJm8q32rPTHWXMbvo); names and thresholds are placeholders.

## Generation callsigns

Assigned once, when a soldier is generated.

- **Strongest attribute decides:** the soldier's highest attribute picks the row, its value picks the column. Every attribute within 5 points of the highest one is a candidate, and one of them is picked at random.
- **No attribute at 40 or above:** the callsign comes from the Generic list.
- **No duplicates:** never a callsign already used by a living soldier in the roster. If a list is used up, the next soldier gets a number suffix (Ox-2).

| Strongest attribute | 40–59 | 60–79 | 80–100 |
| --- | --- | --- | --- |
| Strength | Brick, Crate, Hauler | Ox, Anvil, Boulder | Bear, Mountain, Atlas |
| Endurance | Rawhide, Stubborn, Leather | Oak, Granite, Grit | Bedrock, Concrete, Ironwood |
| Agility | Hare, Swift, Dash | Cat, Lynx, Ferret | Whip, Mongoose, Flash |
| Perception | Lookout, Watcher, Eyes | Owl, Radar, Ears | Falcon, Searchlight, Argus |
| Marksmanship | Trigger, Plinker, Shot | Deadeye, Crosshair, Zero | Needle, Pinpoint, Ace |
| Recon | Mouse, Quiet, Shade | Fox, Shadow, Smoke | Wraith, Phantom, Mist |
| Medical | Plaster, Aid, Bandage | Medic, Stitch, Iodine | Surgeon, Angel, Saint |
| Technical | Spanner, Fixer, Bolts | Wrench, Sparks, Gizmo | Prof, Circuit, Gearbox |

**Generic** (no attribute at 40 or above): Kid, Pup, Sparrow, Bones, Private.

## Earned callsigns (OPTIONAL — ignore for the first build iterations)

Deeds by prestige rank. A deed's callsign replaces the current one only if its prestige is higher; a callsign the player has chosen is never replaced. Each deed counts only once per soldier, and a milestone already reached (5 ops) does not trigger again later. If a deed's callsign list is used up, the soldier keeps the current callsign.

| Prestige | Deed | Callsigns |
| --- | --- | --- |
| 1 | Came home from 5 ops | Steady, Old Boot |
| 1 | Brought home 100 kg or more of loot in one op | Mule, Packhorse |
| 1 | Treated 10 wounds in the field | Doc, Patch |
| 2 | Cleared 3 minefields or demolition targets | Sapper, Fuse |
| 2 | Kill at 50 tiles or more | Longshot, Hawk |
| 2 | Survived a fight with the head or thorax below 10% HP | Lucky, Scratch |
| 3 | Three kills in one activation | Scythe, Hammer |
| 3 | Only squad member to make it back from an op | Lone, Last Man |
| 4 | Carried or dragged a wounded squadmate to an exit under fire | Shepherd, Anchor |
| 4 | Captured a VIP alive | Hound, Collar |
| 4 | Returned to an FOB after being reported MIA | Revenant, Ghost |
| 5 | Killed a General or a faction leader | Headsman, Kingmaker |
| 5 | Came home from 50 ops | Grandfather, Iron |
