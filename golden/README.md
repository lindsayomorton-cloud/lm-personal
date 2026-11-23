# Golden Eagle Syrup: Website Redesign Concept

An unofficial redesign concept for [Golden Eagle Syrup](https://www.goldeneaglesyrup.com), the family-run syrup company in Fayette, Alabama, since 1928. Designed by Lindsay Morton.

> **Not the official Golden Eagle Syrup website.** This is a concept only. Shop and contact links open the company's existing store and forms.

## What's inside

A static site: plain HTML, CSS and JavaScript. It has no build step and no dependencies.

```
index.html      page shell, loads the fonts
style.css       all styles
site.js         pages, content and interactions (single-page, hash routing)
assets/         photos, logos, product images
```

Pages: Home, About, Recipes, Shop, Stories, Fundraiser, Gallery, Journal, Contact. Each page has its own URL hash (`#about`, `#recipes`, `#shop`, …).

## Run it locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Publish with GitHub Pages

1. Create a new repository on GitHub and upload the contents of this folder, with `index.html` at the root.
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then save.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

## Notes

- **Photos and logos** belong to Golden Eagle Syrup Company, Southern Living, or their original sources. They were gathered for this concept and need permission before any public or commercial use.
- **Customer stories** are summaries of stories shared on the official site, not direct quotes.
- **Shop prices** are as listed on the official store on November 22, 2026, and may have changed.
- Fonts load from Google Fonts: Fraunces, DM Sans, Playball and Caveat.
