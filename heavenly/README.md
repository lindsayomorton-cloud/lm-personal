# The Heavenly Donut Co. — Website

Marketing site for The Heavenly Donut Co., a family-owned doughnut shop in Birmingham, AL (est. 2013).

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `menu.html` | Menu |
| `our-story.html` | Our Story |
| `food-truck.html` | Food Truck (Vincent Van Dough) + booking form |
| `join-our-team.html` | Careers letter + application form |

## Structure

```
site/
├── index.html, menu.html, our-story.html, food-truck.html, join-our-team.html
├── js/
│   ├── support.js        # page runtime (renders each page's template + logic)
│   └── image-slot.js     # drag-and-drop image placeholder component
└── assets/images/
    ├── brand/            # logo
    ├── about/            # owners / family
    ├── clouds/           # cloud-01 … cloud-08
    ├── events/           # event photography
    ├── press/            # press logos, Alton Brown
    ├── products/         # doughnuts, kolaches, coffee, boxes
    ├── social/           # Instagram tiles
    ├── stickers/         # sprinkle-donut-a … d
    └── truck/            # food truck photos
```

## Conventions

- File and folder names are lowercase kebab-case.
- Images are WebP (max 1600px wide), except the logo and family photo (AVIF).
- Images below the first section use `loading="lazy"`.
- Styles are inline per element; shared rules (fonts, keyframes, resets) live in each page's `<helmet><style>`.

## Running locally

Any static server works:

```
npx serve site
# or
python3 -m http.server --directory site
```

## Deploying to GitHub Pages

1. Create a new GitHub repository.
2. Upload the contents of this folder (so `index.html` sits at the repo root).
3. Settings → Pages → Source: **Deploy from a branch** → Branch: `main`, folder: `/ (root)` → Save.
4. The site goes live at `https://<username>.github.io/<repo>/` within a minute or two.

No build step. `.nojekyll` is included so GitHub serves every file as-is.

## To do before launch

- Connect the Food Truck and Join Our Team forms to a real endpoint (Formspree, Netlify Forms, or the shop's existing form). They currently show a thank-you message only.
- Confirm Facebook and X/Twitter URLs on `food-truck.html`.
- Replace the Kolaches photo on the home page if a higher-quality shot is available.
