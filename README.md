# AI Commerce Agent Demo

A frontend-first, English-language AI shopping concierge demo for pre-sales presentations. The default catalog is a Nike Jordan lineup.

Live demo: https://luyi-chen.github.io/ai-commerce-agent-demo/

## Stack

- Next.js 15 (App Router, static export), React 19, TypeScript
- Tailwind CSS 4, Framer Motion, Lucide React
- Zustand for cart and chat state

The site is a fully static export, so the concierge logic (`lib/product-tools.ts`) runs in the browser. No server or API key is needed.

## Features

- AI shopping concierge chat with budget, product-name, and quantity understanding
- Side-by-side comparison when two products are named
- Add-to-cart from chat ("add 2 pairs of Jordan Session")
- Shopping cart sidebar with quantity controls and complementary suggestions
- Product detail modal
- Mock checkout with instant order confirmation

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The dev server binds to `0.0.0.0`, so other devices on the same network can use `http://<your-LAN-IP>:3000` (allow inbound port 3000 in the firewall).

`.npmrc` sets `production=false` so dev tooling still installs in shells where `NODE_ENV=production` is preset.

## Catalog data

Products live in `data/nike-jordan-products.json` (24 Jordan shoes, images served from `static.nike.com`). `data/products.ts` derives summaries, features, use cases, and related-product links from it.

## Environment variables

- `NEXT_PUBLIC_BASE_PATH`: URL prefix used when the site is served from a sub-path, such as `/ai-commerce-agent-demo` on GitHub Pages. Leave it unset for local development.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which lints, builds the static site into `out/`, and publishes it to GitHub Pages.

To preview a production build locally:

```bash
npm run build
npx serve out
```

## Roadmap note

A real LLM brain cannot call the model directly from GitHub Pages without exposing the API key. It will need a small serverless proxy (for example Vercel or Cloudflare Workers) that the static site calls.

## Demo scenarios

- "I need Jordan shoes under $150"
- "Compare Jordan Sixty Plus Low and Jordan Spizike Low"
- "Add 2 pairs of Jordan Session to my cart"
- "Show me Jordan sneakers between $100 and $130"
- Continue to checkout and confirm the mock order
