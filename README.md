# ICCL Website

Official website for **Inhale Culture Celebrate Life Ltd (ICCL)** — a registered Australian charity.

## Tech

- [Eleventy](https://www.11ty.dev/) — static site generator (Nunjucks templates)
- [TypeScript](https://www.typescriptlang.org/) — compiled with [esbuild](https://esbuild.github.io/)
- [GitHub Pages](https://pages.github.com/) — hosting, auto-deployed via GitHub Actions

## Local development

```powershell
npm install
npm run dev
```

Open `http://localhost:8080/`. Development URLs are generated from the local
server root.

## Production preview

```powershell
npm run preview
```

Open `http://127.0.0.1:4173/inhaleculturecelebratelife/`. This rebuilds and
serves the exact GitHub Pages path structure. Do not open `_site/index.html`
directly: the production build intentionally uses the repository path prefix.

---

Developed by **Dhawa Lama**.
