# Rutiner

Delad rutinapp för Adrian och Kemal: dagens uppgifter, avbockning i realtid, streaks och statistik.

- Ren HTML/CSS/JS (`index.html`, `styles.css`, `app.js`, `images.js`) som publiceras med GitHub Pages.
- Installerbar på hemskärmen (PWA: `manifest.json`, `sw.js`).
- Data sparas i Firebase Firestore under `hem/<nyckel>/` (users, routines, tasks, checks).
- Nyckeln skickas med i länken efter `#` och sparas sedan i telefonen. Den finns inte i koden.
- Varje person loggar in med en egen PIN-kod som väljs första gången.
