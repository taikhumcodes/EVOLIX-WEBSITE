# Evolix — Business Growth & Technology Agency

A premium, production-ready marketing website for **Evolix**, built entirely with hand-authored HTML5, CSS3 and vanilla JavaScript — no frameworks, no CSS libraries, no build step required.

## Tech Stack

- **HTML5** — semantic markup, ARIA labelling, structured metadata
- **CSS3** — custom properties (design tokens), Grid/Flexbox layout, glassmorphism, gradient text, scroll-driven reveal animations
- **Vanilla JavaScript** — no dependencies, no libraries. Every interaction (navbar, cursor glow, particles, counters, sliders, accordion, forms, gallery filtering) is hand-written.

## Project Structure

```
EVOLIX/
│
├── index.html              Single-page site markup
│
├── css/
│   ├── style.css            Design tokens, base styles, layout, components
│   ├── animation.css         Keyframes and motion classes
│   └── responsive.css        Breakpoint overrides (mobile-first)
│
├── js/
│   ├── main.js               Navbar, cursor glow, scroll progress, particles,
│   │                          parallax, ripple, forms, back-to-top
│   ├── gallery.js             Product photography category filtering
│   └── animations.js          Scroll reveal, counters, card tilt,
│                               testimonials slider, FAQ accordion
│
├── assets/
│   ├── logo/                 Brand mark, favicon
│   ├── hero/                 Hero section imagery / OG cover
│   ├── services/              Service card supporting imagery
│   ├── companies/              Trusted-company logo assets
│   ├── featured-project/       Case study supporting imagery
│   ├── product-images/         Product image assets
│   ├── aplus_images/           Amazon A+ module imagery
│   ├── gallery/                Product photography gallery images
│   ├── testimonials/           Client headshots
│   ├── illustrations/          Custom illustration assets
│   ├── mockups/                Laptop / phone device mockups
│   ├── patterns/               Background pattern assets
│   ├── screenshots/            Product/UI screenshots
│   ├── bg/                     Background imagery (incl. map placeholder)
│   ├── icons/                  Standalone icon assets
│   ├── videos/                 Video assets
│   └── fonts/                  Self-hosted font fallback (if needed)
│
└── README.md
```

## Design System

| Token      | Value                    |
|------------|--------------------------|
| Background | `#050816`                |
| Surface    | `#0E1628`                |
| Primary    | `#2D8CFF`                |
| Accent     | `#63B3FF`                |
| Glow       | `#4FA8FF`                |
| Text       | `#FFFFFF`                |
| Muted      | `#A8B3C7`                |
| Glass      | `rgba(255,255,255,.08)`  |

**Typography:** Space Grotesk (primary, body + UI) paired with Orbitron (display, used sparingly for eyebrows, stats and the logotype).

All tokens live in `css/style.css:root` — update them there to re-theme the entire site.

## Sections

1. Hero — animated background, glassmorphism dashboard mockup, live counters
2. Trusted Companies — infinite marquee
3. Services — 6 premium service cards with hover glow + tilt
4. Featured Project — case study with laptop/phone device mockups
5. Product Photography — filterable gallery
6. Amazon A+ Showcase — banner, comparison, lifestyle and infographic modules
7. Process — 4-step animated timeline
8. Why Evolix — feature cards + animated counters
9. Testimonials — auto-advancing glass-card slider
10. FAQ — accordion
11. Contact — validated form + map placeholder
12. Footer — links, newsletter signup, social

## Database (Visit Logging + Form Storage)

The site can log every page visit and store every contact-form / newsletter
submission in a real database, using [Supabase](https://supabase.com)
(a free, hosted Postgres backend with a JS client — no server to build).

**Setup:**

1. Create a free project at supabase.com.
2. Open the **SQL Editor** in your Supabase dashboard, paste in the contents
   of `supabase/schema.sql`, and run it. This creates three tables
   (`page_visits`, `project_inquiries`, `newsletter_signups`) with Row Level
   Security policies that allow the public key to *insert* data only —
   it can never read, edit, or delete anything.
3. In **Project Settings → API**, copy your **Project URL** and **anon
   public** key.
4. Open `js/database.js` and paste them into the two constants at the top:
   ```js
   var SUPABASE_URL = 'https://your-project.supabase.co';
   var SUPABASE_ANON_KEY = 'sb_publishable_B4DOOEe1FWb0bVRBAbMCrQ_Yq2xen4Z';
   ```
5. Deploy/reload the site. From then on:
   - Every page load writes a row to `page_visits` (path, referrer, user
     agent, an anonymous per-tab session id — no cookies, no personal data).
   - Every "Start a Project" form submission writes a row to
     `project_inquiries` with the name, email, company, budget and message.
   - Every newsletter signup writes a row to `newsletter_signups`.
6. View submissions any time in the Supabase dashboard under **Table
   Editor**. You can also set up an email alert for new rows via
   Supabase's built-in Database Webhooks if you want to be notified
   instantly when someone submits the form.

If `js/database.js` is left unconfigured, the site still works exactly as
before — forms just show a local success message without saving anywhere,
and visit logging silently does nothing. Nothing breaks either way.

**Alternative (no database, zero setup):** if you'd rather not manage a
database at all, swap the contact form for a hosted form backend like
[Web3Forms](https://web3forms.com) or [Formspree](https://formspree.io) —
both offer a free tier that emails you each submission directly, with only
a couple of lines of JS to change.

## Running Locally

No build step. Open `index.html` directly in a browser, or serve the folder with any static server, e.g.:

```bash
npx serve .
```

## Notes

- All imagery referenced in `assets/` is a placeholder path — drop in final production assets using the same filenames and folder structure to go live.
- Reduced-motion preferences are respected across all animated elements (`prefers-reduced-motion`).
- The contact and newsletter forms perform full client-side validation; wire up `js/main.js` to your backend/API endpoint to make them functional in production.
