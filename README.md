# Big4dle

Guess the pro team (NFL, MLB, NBA, NHL) from four hints. 5 guesses.

- Static, no build step. Serve this folder.
- Four hints in a 2×2 board, opened top-left to bottom-right: the team's song (a play button, 30-second clip), then the fan base name, the mascot, and the home jersey colors. The first hint (the song) is shown at the start; the next three open one at a time, one per guess, starting after the first guess. Words that would give the team away are blanked out. Data is in `hints.js` (compiled from memory, edit freely); clips come from Apple's public iTunes preview service.
- Two editions: Current Teams (default) and All-Time (adds teams that no longer exist).
- The daily team comes from `schedule.js`: every team gets exactly one turn, in a random order, before any team repeats; then a fresh random order starts. It depends only on the date, so everyone gets the same team. (Days before 2026-11-18 used the earlier random picker.)
- Wordle-style feedback: green = right team, yellow = wrong team but right sport, plain = wrong sport. Each guess also shows how far it is from the answer in km (no direction; city locations are in `places.js`).
- Stats and today's progress live in `localStorage`.

- Deploys: pushing to `main` deploys automatically (Cloudflare Pages).
- Practice link: `?practice` opens a random practice round (add `&edition=alltime` for the all-time pool). Practice rounds never change your daily game or streak.
