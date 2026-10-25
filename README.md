# Subham Agrawal: portfolio

Static site on Vercel (auto-deploys on every push to `main`).

- `index.html`: professional page. `life.html`: Off the clock (photography and hobbies).
- `style.css` and `main.js` are shared by both pages.
- Images live in `img/`: `portrait.jpg` (hero), `hero-alpenglow.jpg` + `hero-alpenglow-1200.jpg` (Off the clock hero), `proj-*.{png,jpg}` (project visuals), `photos/*.jpg` (gallery).
- Add a gallery photo: resize to ~1400 px on the long side, put it in `img/photos/`, and copy one `<figure>` block into the right chapter in `life.html`. Keep its real `width`/`height` on the `<img>`: the filmstrip uses them to size the frame. Update the chapter's frame count on its pillar.
- Look: dark by default (light via the toggle), lime accent, Space Grotesk headings with Instrument Serif italics. Colours are tokens at the top of `style.css`.
- Motion lives in `main.js` and the `/* motion */` block of `style.css`: first-visit preloader, page curtain (the page tips back as it leaves), smooth scroll (`vendor/lenis.min.js`, MIT), headline words that flip up in 3D, image wipes, count-up numbers, project cards that stack in 3D on tall screens, cards that tilt toward the pointer, a cursor ring, the photo ring on the home page and the pinned filmstrip that rolls round a drum. All of it switches off for visitors who ask for reduced motion.
- `surface.js` draws the home hero: a WebGL implied-vol surface (illustrative, not market data) that follows the pointer. Without WebGL the hero falls back to plain gradients.
- The home page photo ring uses 480×640 crops in `img/thumbs/`.
- Update the resume: replace `Subham_Agrawal_Resume.pdf`.
