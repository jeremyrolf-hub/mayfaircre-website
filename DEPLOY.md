# Mayfair — Deployment Guide

Canonical domain: **mayfaircre.com** · Second domain: **mayfaircre.net** → 301 → mayfaircre.com
Host: **GitHub Pages** · Form backend: **Google Apps Script**
DNS for **mayfaircre.com**: **Squarespace** (registrar + DNS).
DNS for **mayfaircre.net**: **Cloudflare** (free plan), used only to 301-redirect to .com.

Work through the steps in order. Nothing in Step 2 or 3 will work until the repo is
pushed (Step 1) and GitHub Pages is enabled.

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

## Step 2 — Squarespace DNS for mayfaircre.com (canonical)

`mayfaircre.com` is registered at **Squarespace**, which also hosts its DNS. Squarespace
has no proxy layer, so every record is plain DNS (no "grey/orange cloud" toggle to worry
about).

In Squarespace: **Domains → mayfaircre.com → DNS / DNS Settings**.

### 2a. Remove the Squarespace defaults that conflict
Delete the **Squarespace Defaults** block (the parking `A`/`CNAME` records pointing at
Squarespace). **Leave the Google Workspace MX records intact** (email).

### 2b. Add the four apex A records
GitHub's currently documented Pages apex IPs (verified against GitHub's official docs).
Add four `A` records on host `@`:

| Type | Host | Value             |
|------|------|-------------------|
| A    | `@`  | `185.199.108.153` |
| A    | `@`  | `185.199.109.153` |
| A    | `@`  | `185.199.110.153` |
| A    | `@`  | `185.199.111.153` |

### 2c. Add the www CNAME

| Type  | Host  | Value                      |
|-------|-------|----------------------------|
| CNAME | `www` | `jeremyrolf-hub.github.io`  |

The CNAME value is `jeremyrolf-hub.github.io` — your user subdomain, **with no repository
name** on the end.

### 2d. Finish HTTPS on GitHub
- DNS usually resolves within minutes (up to an hour). In the GitHub repo: **Settings →
  Pages** → **Check again** until the banner reads "DNS check successful."
- Once GitHub shows the certificate is issued, tick **Enforce HTTPS**.
- Verify: <https://mayfaircre.com> and <https://www.mayfaircre.com> both load over HTTPS.

➡️ **Status:** A records + www CNAME added on Squarespace, defaults removed, MX intact. ✔

---

## Step 3 — mayfaircre.net → 301 redirect to mayfaircre.com (Cloudflare)

`mayfaircre.net` is on a **free Cloudflare plan** (zone Active). We redirect *all* `.net`
traffic — root and www — to `https://mayfaircre.com` with a **Redirect Rule**. A redirect
rule only fires for traffic that reaches Cloudflare's edge, so `.net` first needs a
**proxied** placeholder DNS record (it currently resolves to nothing — NXDOMAIN).

In Cloudflare: **dashboard → select the `mayfaircre.net` zone**.

### 3a. Add proxied placeholder DNS records
**DNS → Records → + Add record.** `192.0.2.1` is a reserved test address that is never
contacted — Cloudflare serves the redirect at the edge before any origin lookup. These
records **must be Proxied (orange cloud)** so the rule fires.

| Type | Name  | IPv4 address  | Proxy status   | TTL  |
|------|-------|---------------|----------------|------|
| A    | `@`   | `192.0.2.1`   | **Proxied** 🟠 | Auto |
| A    | `www` | `192.0.2.1`   | **Proxied** 🟠 | Auto |

If either saves as grey ("DNS only"), click the cloud once to turn it **orange
(Proxied)**. Both must be orange — the opposite of how Step 2's records would be on
Cloudflare.

### 3b. Create the Redirect Rule
1. Left sidebar → **Rules → Redirect Rules → Create rule**. Name it `net to com 301`.
2. **When incoming requests match… → Custom filter expression:**
   - **Field:** Hostname · **Operator:** ends with · **Value:** `mayfaircre.net`

   (This matches both `mayfaircre.net` and `www.mayfaircre.net`. To paste directly, use
   **Edit expression**:)
   ```
   (ends_with(http.host, "mayfaircre.net"))
   ```
3. **Then… → URL redirect:**
   - **Type:** *Dynamic*
   - **Expression** (paste into the expression box):
     ```
     concat("https://mayfaircre.com", http.request.uri.path)
     ```
   - **Status code:** `301`
   - **Preserve query string:** **On**
4. **Deploy.**

### 3c. Verify
- Give it a few minutes (DNS for the new records + rule activation; SSL on a newly active
  zone can take a little longer). Use a fresh/incognito window — your browser may have
  cached the NXDOMAIN.
- Visit <http://mayfaircre.net> and <http://www.mayfaircre.net/anything> — both should land
  on `https://mayfaircre.com/...` with the path preserved, as a **301**.
- The site's HTML also carries `<link rel="canonical" href="https://mayfaircre.com/">`,
  reinforcing single-domain indexing.

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
