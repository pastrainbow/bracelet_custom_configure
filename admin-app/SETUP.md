# Catalogue Admin — embedded Shopify app setup

The catalogue admin (add / edit / delete configurator beads & accessories)
runs **inside the Shopify admin** as an embedded custom app. The code is a
single Cloudflare Worker (`admin-app/worker.mjs` + `ui.html`) — Shopify does
not host app code, so the Worker's free tier is the hosting.

Once set up, every code change ships with **one command**:

```bash
npm run deploy:admin
```

---

## One-time setup

### 1. Cloudflare (hosting, free)

1. Create a free account at <https://dash.cloudflare.com/sign-up> (the
   Workers free tier — 100k requests/day — is far more than this needs).
2. Register your **workers.dev subdomain** (the `<name>` in
   `https://bracelet-catalogue-admin.<name>.workers.dev`): dashboard →
   **Workers & Pages** → follow the onboarding prompt. Without it the deploy
   fails with "You need to register a workers.dev subdomain".
3. Log the CLI in (opens a browser window, one time only):

   ```bash
   npx wrangler login
   ```

### 2. First deploy

```bash
npm install          # pulls in wrangler
npm run deploy:admin
```

The script prints the worker URL, e.g.
`https://bracelet-catalogue-admin.<your-subdomain>.workers.dev` — copy it,
you need it in the next step. It also bakes the built-in catalogue into the
duplicate check and stores `SHOPIFY_CLIENT_SECRET` as a Worker secret; the
store/theme/app ids are read from `.env` at deploy time.

### 3. Point the Shopify app at the worker (Dev Dashboard)

The app **"Bracelet Catalogue Admin"** already exists — it's the Dev
Dashboard app whose Client ID/Secret are in `.env`. It only needs a home
page and one extra scope:

1. Open <https://dev.shopify.com> → your organization → **Apps** →
   **Bracelet Catalogue Admin**.
2. In the app's **Configuration** (naming varies slightly by dashboard
   version — look for *App settings / URLs*):
   - **App URL** (a.k.a. *App home URL*): paste the worker URL from step 2.
   - **Embedded**: make sure the app is set to be *embedded in the Shopify
     admin* (the default for new apps).
3. Under **API access / scopes**, make sure ALL of these Admin API scopes
   are granted (the first four should already be there; **`write_themes` is
   new** — the worker writes sprite PNGs to the theme through the API instead
   of the Shopify CLI):
   - `write_products`
   - `write_inventory`
   - `read_locations`
   - `write_publications`
   - `write_themes`
4. Save / **release** the new configuration (Dev Dashboard apps version
   their config — apply the change to the *Active* release).
5. Re-approve the app on the store so the new scope takes effect: from the
   app's **Distribution** page (custom distribution, single store), open the
   install link for `y4i4ta-hn.myshopify.com` and click through the approval
   screen — it will list the added `write_themes` scope.

### 4. Use it

Shopify admin → **Apps** → **Bracelet Catalogue Admin**. The old local GUI
(`npm run admin`) is gone; this is the same UI, embedded.

---

## Day-to-day: deploying changes

Edit `admin-app/worker.mjs` or `admin-app/ui.html`, then:

```bash
npm run deploy:admin
```

That's it — the Dev Dashboard configuration never needs touching again
unless the worker URL or the scopes change. (The widget itself still
deploys separately via `npm run deploy:shopify`.)

## How auth works (why this is safe to expose on a public URL)

- The page is only usable **inside the store's admin iframe**: the worker
  serves it with a `frame-ancestors` CSP restricted to this store, and the
  UI immediately requires App Bridge.
- Every `/api/*` call carries an **App Bridge session token** — a short-lived
  JWT Shopify mints for the logged-in staff member. The worker verifies its
  HMAC signature against the app's client secret and checks the audience
  (this app) and destination (this store). Anonymous requests get a 401.
- Shopify Admin API calls use a 24 h access token obtained via the **client
  credentials grant** (same mechanism the old local server used), cached and
  auto-refreshed by the worker. The client secret lives only in `.env` and in
  the Worker's write-only secret store.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "This app only works inside the Shopify admin" | You opened the workers.dev URL directly — open it via Shopify admin → Apps. |
| "Not authenticated (…)" on every action | The worker's secret doesn't match the app. Re-check `SHOPIFY_CLIENT_SECRET` in `.env` and redeploy. |
| "Admin API rejected the token (HTTP 401/403)" | A scope is missing or the config wasn't re-approved — redo setup steps 3–5 (especially `write_themes`). |
| Deploy says it needs authentication | `npx wrangler login`, then rerun `npm run deploy:admin`. |
