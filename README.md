# ski-map-vue

An interactive ski resorts map built with Vue 3, Vite, and Leaflet.  
Includes live weather via OpenWeatherMap API, and resort data from `public/resorts.json`.

---

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (disable Vetur).

---

## Type Support for `.vue` Imports in TS

TypeScript cannot handle `.vue` type info by default, so we replace the `tsc` CLI with `vue-tsc` for type checking.  
In editors, use [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar).

---

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

---

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# Build first when testing on CI
npm run build

# Full E2E test
npm run test:e2e

# Only Chromium
npm run test:e2e -- --project=chromium

# Specific test file
npm run test:e2e -- tests/example.spec.ts

# Debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

---

## Data Update

Resort data is stored in `public/resorts.json` and `src/data/resorts.ts`.  
You can edit `resorts.csv` and run:

```sh
node csv-to-both.cjs
```

This updates both files automatically.

---

## 🌐 Deploy to GitHub Pages (One-click)

> Deploy this Vue 3 + Vite + Leaflet map to GitHub Pages.  
> Your site will be live at: `https://<your-username>.github.io/<repo-name>/`

### 1) Set Vite `base`

Edit `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // Use your repo name here. If using custom domain, set base: '/'
  base: '/ski-map-vue/',
})
```

### 2) Add OpenWeatherMap API Key

Create a GitHub Actions secret:

1. **Settings → Secrets and variables → Actions → New repository secret**
2. Name: `VITE_OWM_API_KEY`
3. Value: Your OpenWeatherMap API key.

### 3) Add Deploy Workflow

Create `.github/workflows/deploy.yml`:

```yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: echo "VITE_OWM_API_KEY=${{ secrets.VITE_OWM_API_KEY }}" >> .env.production
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 4) Push & Enable Pages

```sh
git add .
git commit -m "Add GitHub Pages deploy workflow"
git push origin main
```

Then:

- **Settings → Pages → Build and deployment → Source: GitHub Actions**

### 5) Custom Domain (optional)

- Add custom domain in **Settings → Pages → Custom domain**
- For baked-in domain, add `public/CNAME` file with your domain.

---

## Troubleshooting

- **Blank page** → `base` is wrong. Set correct `/repo-name/`.
- **Weather unavailable** → API key not set in GitHub Secrets.
- **CSV changes not online** → Run `node csv-to-both.cjs` before `npm run build` and push.