Original prompt: 用Superpowers 给我设计一个坦克世界的小游戏,目标人群是八岁,容易上手好玩,坦克的话重力的话要有多一些,轻坦和中坦,中坦和坦克间,然后那个炮,每个坦克的任务都不,那个功能都不同,然后要地图要大一些。

- 2026-03-27: User clarified this should be a standalone game program, not a WeChat Mini Program.
- Plan: build a browser-playable canvas game with a single HTML entrypoint, large battlefield, role-based tanks, simple controls, radar/full map, and deterministic test hooks.
- Existing mini program files remain in the workspace for now, but the new deliverable will be the web game.
- Added browser game entry files: `index.html`, `styles.css`, `web-game.js`.
- Added test-friendly hooks: `window.render_game_to_text()` and `window.advanceTime(ms)`.
- Added `server.js` for local static hosting on port 4173.
- Next: run Playwright against the local server, verify start flow, movement, skills, and map toggle, then adjust any issues found.
- Added test-client key aliases: Space = skill, B = super, Enter = start or overview toggle.
- Playwright validation succeeded after Chromium install. Verified start, move right, skill trigger, super trigger, and overview toggle with screenshots and render_game_to_text state files in output/web-game.
