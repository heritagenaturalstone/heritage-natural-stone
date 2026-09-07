# Heritage Natural Stone — Website (Pilot)

One-page, contact-first B2B site for Heritage Natural Stone.
Static HTML/CSS/JS — no build step, published directly via GitHub Pages.

**Live:** https://heritagenaturalstone.com/ (previous address https://batudemir14.github.io/heritage-natural-stone/ redirects here)

## Structure

```
index.html        one-page layout (Hero → Who We Are → Our Team → What We Do
                  [intro reel video] → 2×2 feature grid → Our Values → Contact)
css/style.css     design system & layout
js/main.js        hero logo fly-in + sticky bottom-bar-to-header, bar theme by
                  section, mobile menu, team photo switcher, JS anchor scrolling,
                  scroll reveals, active nav
assets/marble/    marble textures (procedurally generated — placeholder until real photography)
assets/photos/    client-supplied section photos
assets/team/      partner portraits (2 photos each)
assets/video/     intro reel (What We Do)
assets/logo-mark.svg
```

## Design rules (from the internal design guide)

| Color | Hex | Use |
|---|---|---|
| Heritage Charcoal | `#2A2825` | hero, footer, dark premium moments |
| Alabaster | `#F8F3EA` | main content ground |
| Quarry Gold | `#CBAE82` | thin rules, numbers, selective accents |
| Intelligence Navy | `#1F3E52` | sourcing / technology / info areas |

Typography: Cinzel (wordmark) · Montserrat (bold display / regular body).

## TODO before launch

- [x] WhatsApp number connected (+90 535 063 67 63)
- [x] Contact email confirmed (`info@heritagenaturalstone.com`)
- [ ] Replace photos with high-res originals (partner will supply; current hero/quarry images are low-res)
- [ ] Custom domain (`heritagenaturalstone.com`) → set up CNAME
- [ ] Privacy / legal page
- [ ] Analytics

## Publishing

Pushed to `main` → GitHub Pages deploys automatically. No build.

## Image licensing

All marble textures in `assets/marble/` are procedurally generated for this
project (no third-party imagery). They are placeholders pending real photography.
