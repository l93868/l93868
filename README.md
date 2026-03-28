# Tiny Tank World Mini Program Prototype

This workspace contains a WeChat Mini Program prototype for a kid-friendly tank game.

Main goals in this prototype:

- easy for an 8-year-old to pick up
- large battlefield instead of a single small screen
- clear tank roles
- simple controls with auto aiming
- team-based play with friendly AI tanks

## Included in this build

- large map sized at about 5 x 4 screens
- radar map and full overview map
- 4 tank roles: light, medium, heavy, helper
- 3-tank friendly squad
- enemy waves that scale by stage
- role skills and super skills
- simple campaign flow across 4 stages

## Project structure

- `pages/index/` - main game page and touch controls
- `game/tiny-tank-world.js` - battle engine, AI, map, rendering, skills

## Run

1. Open WeChat DevTools.
2. Import `D:\Codex` as a Mini Program project.
3. Use the default `touristappid`.
4. Preview the prototype.

## Controls

- left pad: move
- right buttons: skill and super skill
- right side button: toggle full map
- right side button: switch tank before battle

## Good next steps

- add coins, stars, and rewards
- add destructible terrain and bridges
- add bosses and treasure boxes
- add sound effects and sprite art
- add more mission types for kids
