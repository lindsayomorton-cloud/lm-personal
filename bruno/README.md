# Bruno Montessori Academy — Website Redesign

Static redesign of [brunomontessori.org](https://www.brunomontessori.org) for Joseph S. Bruno Montessori Academy, Birmingham, AL. Plain HTML, CSS and JavaScript with no build step.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Homepage (school's current content) |
| `about.html` | About Bruno |
| `programs.html` | Academics / Programs |
| `montessori.html` | Why Montessori |
| `life.html` | Student Life |
| `admissions.html` | Admissions |
| `concept.html` | Alternate homepage concept (not linked from navigation) |

## Structure

```
index.html, *.html   Pages
style.css            All styles
script.js            Mobile nav, hero slider, tabs, event filters, photo fades
logo-seal.jpeg       School seal (logo + favicon)
accred-*.png         Accreditation logos
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```
npx serve .
# or
python3 -m http.server
```

## Deploy (GitHub Pages)

Push to a repository, then **Settings → Pages → Deploy from branch → `main` / root**.

## Notes

- Photography is loaded from `brunomontessori.org/cms_files/…`. Download and host the images in this repo before launch if the old site will be retired.
- Parents, School Calendar, Schedule a Tour, Apply Online, Tuition and Contact link to the school's existing pages.
- Search in the top bar has no destination yet. Giving and the news links are placeholders.
- Fonts: Cormorant Garamond, EB Garamond, Fraunces and DM Sans via Google Fonts.

## Brand colors

| Token | Hex |
| --- | --- |
| Bruno blue | `#0F4D92` |
| Secondary blue | `#2C5794` |
| Logo bright blue (primary CTAs) | `#0029D8` |
| Gold accent | `#F2B33D` |
