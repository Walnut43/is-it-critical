# Is It Critical?

## Description

Is It Critical? is a cybersecurity vulnerability dashboard built on top of NIST's
National Vulnerability Database (NVD). The goal of this app is to make CVE
(Common Vulnerabilities and Exposures) data more accessible and readable for
people who are curious about cybersecurity trends but don't want to dig through
raw API responses. You can search and filter vulnerabilities, view severity
breakdowns, and click into individual CVEs for more detail.

Data is pulled from the NVD API and stored in a Supabase database so the
dashboard doesn't have to hit the NVD every time someone loads the page.

## Target Browsers

This app is built for desktop browsers. It works best on:

- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge

It wasn't really designed for mobile but Bootstrap makes it mostly usable on
smaller screens anyway (hopefully).

## Link to Developer Manual

The developer manual is in the bottom half of this file, just keep scrolling :)

---

# Developer Manual

## How to Install

You'll need Node.js on your machine. The easiest way to get it is through nvm
(Node Version Manager):

```bash
nvm install node
```

Once you have Node, clone the repo and install the dependencies:

```bash
git clone https://github.com/Walnut43/is-it-critical.git
cd is-it-critical
npm install
```

## Setting Up Your Environment

The app needs a few secret keys to connect to Supabase and the NVD API.
Create a file called `.env` in the root of the project and add these:

SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
NVD_API_KEY=your_nvd_api_key

Where to find these:
- Supabase URL and key: go to your Supabase project, hit Project Settings, then API
- NVD API key: request one for free at https://nvd.nist.gov/developers/request-an-api-key

Don't commit your .env file to GitHub. It's already in .gitignore so as long as
you don't manually add it you should be fine.

## How to Run the App

Start the server with:

```bash
npm start
```

Then open your browser and go to http://localhost:3000 and you should see the app.
nodemon is set up so the server restarts automatically whenever you save a file,
so you don't have to keep restarting it manually.

## Setting Up the Database

The app uses one table in Supabase called `cves`. You'll need to create it
manually in your Supabase dashboard with these columns:

| Column | Type |
|---|---|
| id | text (primary key) |
| published | timestamp |
| last_modified | timestamp |
| severity | text |
| base_score | float4 |
| description | text |
| attack_vector | text |
| affected_products | json |

Once the table is created, you need to populate it with data. With the app
running, either hit the Sync NVD button in the navbar or call this endpoint
directly in Insomnia:
GET http://localhost:3000/api/sync

This will fetch 2000 CVEs from the NVD and load them into your database.
It might take a few seconds so just be patient. You can check the results in the Supabase dashboard after to see if it worked.

## API Endpoints

Here are all the endpoints the app uses. You can test any of these in Insomnia
while the server is running.

### GET /api/cves
Gets CVEs from the database. You can pass optional filters as query parameters.

Available filters:
- `keyword` - search by keyword in the description
- `severity` - filter by CRITICAL, HIGH, MEDIUM, or LOW
- `days` - how far back to look (7, 30, 90, 365, or all)

Example:
GET /api/cves?severity=critical&days=30

---

### GET /api/cves/:id
Gets a single CVE by its ID. Used on the CVE detail page.

Example:
GET /api/cves/CVE-2026-21897
---

### GET /api/sync
Calls the NVD API and syncs the most recent CVEs into the database. Grabs
up to 2000 CVEs from the last 120 days and skips any that are marked as
Rejected by NVD.

---

### GET /api/summary
Returns how many CVEs exist for each severity level. Used for the summary
cards on the dashboard.

Example response:
```json
{
    "critical": 245,
    "high": 1033,
    "medium": 1116,
    "low": 155
}
```

---

### GET /api/attack-vectors
Returns CVE counts grouped by attack vector. Used for the bar chart.

Example response:
```json
{
    "NETWORK": 1200,
    "LOCAL": 400,
    "PHYSICAL": 50,
    "ADJACENT": 30,
    "Unknown": 206
}
```

## Testing

There are no automated tests for this project. To test manually, start the
server and use Insomnia to call each endpoint above and make sure they return
the expected data. The browser console is also helpful for catching any
frontend errors.

## Known Bugs

- The sync endpoint is technically a GET request even though it writes data
  to the database. It should be a POST but GET was easier to test during
  development.
- Table sorting in the CVE feed only sorts the 25 rows currently visible on
  the page. It doesn't sort the full dataset across all pages.
- Some CVEs show N/A for severity and attack vector. This is a data issue
  from the NVD side, not a bug in the app. Those CVEs either haven't been
  fully analyzed yet or use a CVSS version the app doesn't handle.

## Future Development Ideas

Here are some things that would make this app better if someone wanted to
keep working on it:

- Add a proper scheduled sync so the database updates itself automatically
  every few days without anyone having to click the button
- Fix the sorting so it works across all pages not just the current one
- Add CSV export so users can download the filtered CVE results
- Add debounced search so the table filters as you type instead of requiring
  a button click
- Add more filter options like attack complexity or affected vendor
- Add user accounts so people can save and bookmark CVEs they care about
- Better mobile support