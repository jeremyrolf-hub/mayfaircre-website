# Mayfair — Deployment Guide

Canonical domain: **mayfaircre.com** · Second domain: **mayfaircre.net** → 301 → mayfaircre.com
Host: **GitHub Pages** · Registrar + DNS: **Cloudflare** · Form backend: **Google Apps Script**

Work through the steps in order. Nothing in Step 2 or 3 will work until the repo is
pushed (Step 1) and GitHub Pages is enabled. SSL on the apex domain depends on every
Cloudflare record being **DNS only (grey cloud)** — this is the single most common
failure, so it is called out explicitly below.

---

## Step 1 — GitHub repository + Pages (GitHub Desktop, no terminal)

The local repo is already committed and contains a `CNAME` file set to `mayfaircre.com`,
which tells GitHub Pages your custom domain automatically on first build. GitHub Desktop
will both create the GitHub repo and push your folder in one step — it handles login for
you, so no Personal Access Token is needed.

### 1a. (Only if needed) install / sign in to GitHub Desktop
- **Install:** go to <https://desktop.github.com>, click **Download for Windows**, run the
  installer.
- **Sign in:** on first launch click **Sign in to GitHub.com** (or **File → Options →
  Accounts → Sign in**). Sign in as **jeremyrolf-hub**. You can skip/confirm the
  "configure Git" name/email screen with **Continue**.

### 1b. Add your local folder to GitHub Desktop
1. Menu bar: **File → Add Local Repository…**
2. Click **Choose…** and browse to `C:\Users\jerem\Documents\mayfaircre-website`.
3. Click **Select Folder**, then **Add Repository**.
   (It's already a Git repo, so Desktop adds it directly. The left panel will show recent
   commits like "Add deploy artifacts…".)

### 1c. Publish (this creates the public repo AND pushes)
1. At the top of the window click the **Publish repository** button.
2. In the dialog:
   - **Name:** `mayfaircre-website`
   - **Description:** optional
   - **⚠️ Uncheck "Keep this code private"** — it must be **public** for free GitHub Pages.
   - **Organization / owner:** leave as **jeremyrolf-hub**.
3. Click **Publish repository**. When the top button changes to **Fetch origin**, the push
   is done. Your repo is now at
   `https://github.com/jeremyrolf-hub/mayfaircre-website`.

### 1d. Enable GitHub Pages (in the browser)
1. Open <https://github.com/jeremyrolf-hub/mayfaircre-website> → **Settings** (top tab) →
   **Pages** (left sidebar).
2. **Build and deployment → Source:** choose **Deploy from a branch**.
3. **Branch:** `main` · **Folder:** `/ (root)` → click **Save**.
4. **Custom domain** should already show `mayfaircre.com` (from the `CNAME` file). If it's
   blank, type `mayfaircre.com` and click **Save**.
5. Leave **Enforce HTTPS** unchecked for now — it can't be turned on until DNS resolves
   (you'll return to it at the end of Step 2).

GitHub will show "DNS check in progress" until Step 2 is done. That's expected.

➡️ **Report back:** (a) that **Publish repository** finished, and (b) what the **Custom
domain** box on the Pages screen says (it should read `mayfaircre.com`). Then we go to
Step 2.

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

## Step 3 — mayfaircre.net → 301 redirect to mayfaircre.com (Squarespace)

> Both domains are registered at **Squarespace**, so this uses Squarespace's built-in
> **Domain Forwarding** (not a Cloudflare rule). Goal: every `mayfaircre.net` request
> permanently (301) redirects to `https://mayfaircre.com`, so the site is never served or
> indexed on two domains.

### 3a. Open the domain
1. Sign in at <https://account.squarespace.com> with the account that holds the domains.
2. Go to **Domains** → click **mayfaircre.net** to open its dashboard.

### 3b. Add the forward
1. In the domain's settings, open the **Forwarding** section (labeled **Domain
   Forwarding** / **Web Forwarding**). Click **Add** / **Forward domain**.
2. Set:
   - **Forward to / Destination URL:** `https://mayfaircre.com`
   - **Forwarding type:** **Permanent (301)** — *not* Temporary (302).
   - **Path forwarding / Preserve path:** **On** if offered (so `/x` on `.net` → `/x` on
     `.com`). Optional but nicer.
3. **Save.**

### 3c. Cover www too
- If the forward applies to the whole domain (root **and** subdomains), you're done.
- If it only covers the root, add a second forward for **`www.mayfaircre.net`** →
  `https://mayfaircre.com` (same Permanent/301 setting), or confirm the "forward all
  subdomains / include www" toggle is on.

Squarespace auto-configures the `.net` DNS and provisions SSL for the forward; allow a few
minutes to an hour. Leave `.net` DNS otherwise empty — do **not** add GitHub A records to
`.net`.

### 3d. Verify
- Visit <http://mayfaircre.net> and <http://www.mayfaircre.net> — both should land on
  `https://mayfaircre.com`.
- It should be a **301** (permanent). The site's HTML also carries
  `<link rel="canonical" href="https://mayfaircre.com/">`, which reinforces single-domain
  indexing.

### Fallback (only if Squarespace won't do a clean 301)
If the forwarding UI offers only a 302/temporary forward, the cleanest alternative is to
move **mayfaircre.net** (its nameservers only) to a free **Cloudflare** account and use a
**Redirect Rule** (proxied `192.0.2.1` placeholder records + a dynamic 301 to
`concat("https://mayfaircre.com", http.request.uri.path)`). Ask and I'll write those exact
clicks.

➡️ **Tell me once visiting `mayfaircre.net` redirects to `mayfaircre.com`.**

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
