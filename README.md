# Big4dle

Guess the pro team (NFL, MLB, NBA, NHL) from four hints. 5 guesses.

- Static, no build step. Serve this folder.
- Four hints in a 2×2 board, opened top-left to bottom-right: the team's song (a play button that streams Apple's 30-second preview exactly as returned, with the title and artist and a "Listen on Apple Music" link and badge), then the fan base name, the mascot, and the home jersey colors. Nothing is open at the start. After the first guess the song opens, then one more hint after each guess (fan base, mascot, colors). Words that would give the team away are blanked out. Data is in `hints.js` (compiled from memory, edit freely); clips come from Apple's public iTunes preview service.
- Two editions: Current Teams (default) and All-Time (adds teams that no longer exist).
- The daily team comes from `schedule.js`: every team gets exactly one turn, in a random order, before any team repeats; then a fresh random order starts. It depends only on the date, so everyone gets the same team. (Days before 2026-11-18 used the earlier random picker.)
- Wordle-style feedback: green = right team, yellow = wrong team but right sport, plain = wrong sport. Each guess also shows how far it is from the answer in km (no direction; city locations are in `places.js`).
- Stats and today's progress live in `localStorage`.

- Deploys: pushing to `main` deploys automatically (Cloudflare Pages).
- Practice link: `?practice` opens a random practice round (add `&edition=alltime` for the all-time pool). Practice rounds never change your daily game or streak.
- All-time mode is locked for now: set `ALLTIME_LOCKED = false` at the top of `game.js` to unlock it. The tab shows a lock, and `?edition=alltime` links fall back to current teams while it is locked.
