# Subham Agrawal: portfolio

Static site on Vercel (auto-deploys on every push to `main`).

- `index.html`: professional page. `life.html`: Off the clock (photography and hobbies).
- `style.css` and `main.js` are shared by both pages.
- Images live in `img/`: `portrait.jpg` (hero), `hero-alpenglow.jpg` + `hero-alpenglow-1200.jpg` (Off the clock hero), `proj-*.{png,jpg}` (project visuals), `photos/*.jpg` (gallery).
- Add a gallery photo: resize to ~1400 px on the long side, put it in `img/photos/`, and copy one `<figure>` block into the right chapter in `life.html`. Keep its real `width`/`height` on the `<img>`: the filmstrip uses them to size the frame. Update the chapter's frame count on its pillar.
- Motion lives in `main.js` and the `/* motion */` block of `style.css`: first-visit preloader, page curtain, smooth scroll (`vendor/lenis.min.js`, MIT), words that blur in, image wipes, count-up numbers and the pinned filmstrip. All of it switches off for visitors who ask for reduced motion.
- Update the resume: replace `Subham_Agrawal_Resume.pdf`.
