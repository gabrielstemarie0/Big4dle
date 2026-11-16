# Big4dle

Flagle-style game for the big four sports leagues (NFL, MLB, NBA, NHL). 6 guesses, 6 squares; every wrong guess uncovers one more square of a mystery flag.

- Static, no build step. Serve this folder.
- The flag is the national flag of the team's captain (official captain where the league has one, otherwise the franchise star; see `captains.js`), repainted in the team's colors (`flag.js`). Real flag layouts are kept (stripes, crosses, stars, maple leaf, ...). No logos, names or numbers. Team colors and divisions are in `teams.js`. Captain data is from memory and approximate.
- Two editions: Current Teams (default) and All-Time (adds teams that no longer exist).
- The daily team comes from `schedule.js`: every team gets exactly one turn, in a random order, before any team repeats; then a fresh random order starts. It depends only on the date, so everyone gets the same team. (Days before 2026-11-18 used the earlier random picker.) The order squares are revealed in is random per player and is saved with that day's progress. There are no sport or division hints.
- Wordle-style feedback: green = right team, yellow = wrong team but right sport, plain = wrong sport. Each guess also shows how far it is from the answer in km (no direction; city locations are in `places.js`).
- Stats and today's progress live in `localStorage`.

- Deploys: pushing to `main` deploys automatically (Cloudflare Pages).
- Practice link: `?practice` opens a random practice round (add `&edition=alltime` for the all-time pool). Practice rounds never change your daily game or streak.
