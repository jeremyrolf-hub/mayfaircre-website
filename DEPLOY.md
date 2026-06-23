# Mayfair — Deployment Guide

Canonical domain: **mayfaircre.com** · Second domain: **mayfaircre.net** → 301 → mayfaircre.com
Host: **GitHub Pages** · Registrar + DNS: **Cloudflare** · Form backend: **Google Apps Script**

Work through the steps in order. Nothing in Step 2 or 3 will work until the repo is
pushed (Step 1) and GitHub Pages is enabled. SSL on the apex domain depends on every
Cloudflare record being **DNS only (grey cloud)** — this is the single most common
failure, so it is called out explicitly below.

---

## Step 1 — GitHub repository + Pages

The local repo is already committed and contains a `CNAME` file set to `mayfaircre.com`,
which tells GitHub Pages your custom domain automatically on first build.

### 1a. Create the empty repo on GitHub
1. Go to <https://github.com/new>.
2. **Owner:** `jeremyrolf-hub` · **Repository name:** `mayfaircre-website`.
3. **Public**. Do **not** add a README, .gitignore, or license (the repo already has files).
4. Click **Create repository**.

### 1b. Push the local repo
Run these from the project folder (`C:\Users\jerem\Documents\mayfaircre-website`).
HTTPS is simplest; GitHub will prompt for your username and a **Personal Access Token**
(not your password) — create one at <https://github.com/settings/tokens> if needed
(classic token, scope: `repo`).

```bash
git remote add origin https://github.com/jeremyrolf-hub/mayfaircre-website.git
git push -u origin main
```

### 1c. Enable GitHub Pages
1. Repo → **Settings** → **Pages** (left sidebar).
2. **Build and deployment → Source:** *Deploy from a branch*.
3. **Branch:** `main` · **Folder:** `/ (root)` → **Save**.
4. Under **Custom domain** you should already see `mayfaircre.com` (from the `CNAME`
   file). If it's blank, type `mayfaircre.com` and click **Save**.
5. Leave **Enforce HTTPS** unchecked for now — it can't be enabled until DNS resolves
   and GitHub issues the certificate (you'll come back to it at the end of Step 2).

GitHub will show "DNS check in progress" until Step 2 is done. That's expected.

➡️ **Tell me once 1a–1c are done** (or paste any error from `git push`).

---

## Step 2 — Cloudflare DNS for mayfaircre.com (canonical)

In Cloudflare: **dashboard → select the `mayfaircre.com` zone → DNS → Records**.

### 2a. Delete conflicting records first
Remove any existing `A`, `AAAA`, or `CNAME` record on the root (`@` / `mayfaircre.com`)
and on `www` that points somewhere else (e.g. a parking page). Leave MX/TXT (email)
records alone.

### 2b. Add the four apex A records
These IPs are GitHub's currently documented Pages apex addresses (verified against
GitHub's official docs). Click **+ Add record** four times:

| Type | Name (apex) | IPv4 address      | Proxy status      | TTL  |
|------|-------------|-------------------|-------------------|------|
| A    | `@`         | `185.199.108.153` | **DNS only**      | Auto |
| A    | `@`         | `185.199.109.153` | **DNS only**      | Auto |
| A    | `@`         | `185.199.110.153` | **DNS only**      | Auto |
| A    | `@`         | `185.199.111.153` | **DNS only**      | Auto |

(Using `@` as the name targets the root domain `mayfaircre.com`.)

### 2c. Add the www CNAME

| Type  | Name  | Target                      | Proxy status | TTL  |
|-------|-------|-----------------------------|--------------|------|
| CNAME | `www` | `jeremyrolf-hub.github.io`  | **DNS only** | Auto |

Note: the CNAME target is `jeremyrolf-hub.github.io` — your user subdomain, **with no
repository name** on the end.

### 2d. ⚠️ CRITICAL: set every record to "DNS only" (grey cloud)
GitHub Pages provisions its own SSL certificate and that **fails if Cloudflare proxies
the traffic**. Every record above must be grey, not orange.

- In **DNS → Records**, look at the **Proxy status** column on each row.
- If a row shows an **orange cloud** labeled "Proxied", **click the orange cloud once** —
  it turns **grey** and the label changes to **"DNS only"**.
- Do this for all four `A` records **and** the `www` CNAME. All five must read **DNS only**.

### 2e. Finish HTTPS on GitHub
- DNS usually resolves within minutes (can take up to an hour). Then in the GitHub repo:
  **Settings → Pages** — the banner changes to a green "DNS check successful."
- Once GitHub shows the certificate is issued, tick **Enforce HTTPS**.
- Verify: <https://mayfaircre.com> and <https://www.mayfaircre.com> both load the site
  over HTTPS with no certificate warning.

➡️ **Tell me once both URLs load over HTTPS** (or paste what GitHub's Pages banner says).

---

## Step 3 — mayfaircre.net → 301 redirect to mayfaircre.com

Goal: every `mayfaircre.net` (and `www.mayfaircre.net`) request 301-redirects to the same
path on `mayfaircre.com`, so the site is never indexed on two domains. On Cloudflare's
free plan this is done with a **Redirect Rule**. A redirect rule only fires for traffic
that reaches Cloudflare's edge, so `.net` needs a **proxied** placeholder DNS record.

In Cloudflare: **dashboard → select the `mayfaircre.net` zone**.

### 3a. Add proxied placeholder DNS records
**DNS → Records → + Add record.** The IP `192.0.2.1` is a reserved test address that is
never actually contacted — Cloudflare serves the redirect at the edge before any origin
lookup. These records **must be orange (Proxied)**, the opposite of Step 2.

| Type | Name  | Value         | Proxy status   | TTL  |
|------|-------|---------------|----------------|------|
| A    | `@`   | `192.0.2.1`   | **Proxied** 🟠 | Auto |
| A    | `www` | `192.0.2.1`   | **Proxied** 🟠 | Auto |

### 3b. Create the Redirect Rule
1. Left sidebar → **Rules → Redirect Rules → Create rule** (also reachable under
   **Rules → Overview**). Name it `net to com 301`.
2. **When incoming requests match… → Custom filter expression.** Set:
   - **Field:** Hostname · **Operator:** ends with · **Value:** `mayfaircre.net`

   (Click **Edit expression** if you prefer to paste it directly:)
   ```
   (ends_with(http.host, "mayfaircre.net"))
   ```
3. **Then… → URL redirect.**
   - **Type:** *Dynamic*
   - **Expression** (click the expression box and paste):
     ```
     concat("https://mayfaircre.com", http.request.uri.path)
     ```
   - **Status code:** `301`
   - **Preserve query string:** **On**
4. **Deploy.**

### 3c. Verify
- Visit <http://mayfaircre.net> and <https://www.mayfaircre.net/anything> — both should
  land on `https://mayfaircre.com/...` with the path preserved.
- Confirm it's a **301** (not 302): in your browser DevTools → Network, the first response
  status should be `301`. A 301 is what keeps `.net` out of the search index.

> SSL note for `.net`: Cloudflare's Universal SSL (on by default) provides the edge
> certificate, so `https://mayfaircre.net` redirects cleanly. No GitHub involvement here.

➡️ **Tell me once the `.net` redirect works.**

---

## Step 4 — Contact form backend (Google Apps Script)

You'll be signed in to your **mayfaircre.com Google account** for all of this so the
notification emails come from the right place.

### 4a. Create the Google Sheet
1. Go to <https://sheets.new> (creates a blank spreadsheet on the signed-in account).
2. Rename it something like **"Mayfair — Website Inquiries."**
   (You don't need to add headers or tabs — the script creates the `Submissions` tab and
   header row automatically on the first write.)

### 4b. Add the script
1. In that Sheet: **Extensions → Apps Script.** A new editor tab opens.
2. Delete the default `function myFunction() {}` stub.
3. Open `apps-script/Code.gs` from this repo, copy its **entire** contents, and paste them
   into the editor.
4. Click the **Save** (disk) icon.

### 4c. Authorize + test before deploying
1. In the editor's function dropdown (top toolbar) select **`testSubmission`**, then click
   **Run**.
2. Google will prompt for authorization: **Review permissions → choose your mayfaircre.com
   account → Advanced → "Go to (project) (unsafe)" → Allow.** (This "unsafe" screen is
   normal for your own private script.)
3. Check that:
   - the Sheet now has a `Submissions` tab with one **Test Buyer** row, and
   - **acquisitions@mayfaircre.com** received a "Mayfair inquiry — Test Buyer (Test Co)"
     email.

### 4d. Deploy as a Web App
1. Top-right **Deploy → New deployment.**
2. Click the gear next to "Select type" → **Web app.**
3. Settings:
   - **Description:** `mayfair contact`
   - **Execute as:** **Me (your address)**
   - **Who has access:** **Anyone**  ← required so the public form can POST to it
4. **Deploy** → authorize again if asked.
5. Copy the **Web app URL**. It looks like:
   `https://script.google.com/macros/s/AKfyc…/exec`

➡️ **Paste that Web App URL back to me.** I'll wire it into the form, you redeploy the
site, and we'll run a real end-to-end test (Step 5).

---

## Step 5 — Wire the URL into the form + end-to-end test

*(I do 5a; you do 5b–5c.)*

### 5a. (Me) Insert the endpoint
I'll set `ENDPOINT` at the top of `script.js` to your Web App URL and commit:
```js
var ENDPOINT = "https://script.google.com/macros/s/AKfyc…/exec";
```
Then you push:
```bash
git push
```
GitHub Pages redeploys within a minute or two.

### 5b. (You) Submit a real test
1. Open <https://mayfaircre.com/#contact>, fill the form with test data, and **Send**.
2. The form should show "Thank you. We'll be in touch shortly."

### 5c. (You) Confirm it landed
- A new row appears in the **Submissions** tab.
- **acquisitions@mayfaircre.com** received the notification email.

➡️ **Confirm the row + email arrived** and we're done.

---

## Notes & gotchas

- **Updating the site later:** edit files locally → `git add -A && git commit -m "…" &&
  git push`. Pages redeploys automatically. The `CNAME` file must stay in the repo or the
  custom domain unsets.
- **Internal doc excluded:** `mayfair-architecture.html` is intentionally **untracked and
  git-ignored** so it is never published. Keep it that way.
- **Changing the form later:** if you ever change the Apps Script, use **Deploy → Manage
  deployments → (edit) → New version** so the same Web App URL keeps working — a brand-new
  deployment generates a different URL that you'd have to update in `script.js`.
- **Email from acquisitions@:** notifications are sent by `MailApp` from whichever Google
  account deployed the script (your mayfaircre.com account). The `To:` is hard-coded to
  `acquisitions@mayfaircre.com` in `apps-script/Code.gs`.
