# Subham Agrawal: portfolio

Static site on Vercel (auto-deploys on every push to `main`).

- `index.html`: professional page. `life.html`: Off the clock (photography and hobbies).
- `style.css` and `main.js` are shared by both pages.
- Images live in `img/`: `portrait-summit.jpg` (About photo and link preview; `portrait.jpg` is the earlier lake portrait), `hero-alpenglow.jpg` + `hero-alpenglow-1200.jpg` (Off the clock hero), `proj-*.{png,jpg}` (project visuals), `photos/*.jpg` (gallery).
- Add a gallery photo: resize to ~1400 px on the long side, put it in `img/photos/`, and copy one `<figure>` block into the right chapter in `life.html`. Keep its real `width`/`height` on the `<img>`: the filmstrip uses them to size the frame. Update the chapter's frame count on its pillar.
- Look: dark by default (light via the toggle), lime accent, Space Grotesk headings with Instrument Serif italics. Colours are tokens at the top of `style.css`.
- Motion lives in `main.js` and the `/* motion */` block of `style.css`: first-visit preloader, page curtain (the page tips back as it leaves), smooth scroll (`vendor/lenis.min.js`, MIT), headline words that flip up in 3D, image wipes, count-up numbers, project cards that stack in 3D on tall screens, cards that tilt toward the pointer, a cursor ring, the photo ring on the home page and the pinned filmstrip that rolls round a drum. All of it switches off for visitors who ask for reduced motion.
- `surface.js` draws the home hero: a WebGL implied-vol surface (illustrative, not market data) that follows the pointer. Without WebGL the hero falls back to plain gradients.
- Logo: a σ (volatility) mark on a lime tile plus the name, in the nav, preloader and page curtain (`MARK` in `main.js`). `favicon.svg` and `apple-touch-icon.png` are the same mark.
- The home page photo ring uses 480×640 crops in `img/thumbs/`.
- Phones (up to 820 px wide) get a menu button that opens a full-screen sheet of links; the Resume pill stays in the bar. Up to 760 px the filmstrip is a swiped strip with scroll snapping instead of the pinned drum; the 3D turn sits on each photo's inner `.fx` box so snapping never chases a moving target.
- Phone images: each gallery photo has a 1000 px WebP copy in `img/photos/m/` (served through `<picture>` below 760 px), and `hero-alpenglow-tall.jpg` is a portrait crop for tall screens. When you add a photo, make its `m/` copy too. Chart PNGs are 8-bit palette images. The hero surface runs at 30 fps on touch screens.
- Update the resume: replace `Subham_Agrawal_Resume.pdf`.
