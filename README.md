# AdCellerant Command Center

Sales pipeline management and intelligence platform built on Next.js 14, HubSpot API, and Claude AI.

## Local Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in all values (see Environment Variables below)

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env.local` file (or set in Vercel dashboard):

```bash
# Auth — Google OAuth
GOOGLE_CLIENT_ID=           # Google Cloud Console > APIs & Services > Credentials
GOOGLE_CLIENT_SECRET=       # Same location
NEXTAUTH_SECRET=            # Generate with: openssl rand -base64 32
NEXTAUTH_URL=https://your-domain.vercel.app  # Or http://localhost:3000 for local dev

# HubSpot — Private App Token
HUBSPOT_API_KEY=            # HubSpot > Settings > Integrations > Private Apps
HUBSPOT_PORTAL_ID=47345959
HUBSPOT_OWNER_GEORGE=78947458
HUBSPOT_OWNER_ANDY=80955316
HUBSPOT_OWNER_ALEX=         # Confirm owner ID and add

# AI — Anthropic
ANTHROPIC_API_KEY=          # console.anthropic.com > API Keys

# Access Control
ALLOWED_EMAILS=george.leith@adcellerant.com,andy.mcnab@adcellerant.com,alex.kirkley@adcellerant.com
```

## HubSpot Custom Property Creation

Two custom properties must exist on the Deal object before data can populate:

### Option A: Via API (one-time POST)

After deploying, call `POST /api/hubspot/properties` while authenticated. This creates both properties automatically.

### Option B: Via HubSpot UI

1. Go to **Settings > Properties > Deal Properties**
2. Create `persona_type` (Enumeration/Select):
   - Partner Media (`partner_media`)
   - Partner Agency (`partner_agency`)
   - Enterprise Brand (`enterprise_brand`)
   - Vendasta (`vendasta`)
3. Create `revenue_line` (Enumeration/Select):
   - Canada (`canada`)
   - Vendasta (`vendasta`)
   - UK (`uk`)

## Data Formats

### Booked Revenue CSV

Upload via the dashboard file upload. Expected format:

```csv
rep,month,amount
George Leith,Jan,5563
George Leith,Feb,12161
George Leith,Mar,15146
Andy McNab,Jan,56583
Andy McNab,Feb,42100
```

- **rep**: Full name matching rep config (George Leith, Andy McNab, Alex Kirkley)
- **month**: Three-letter month abbreviation (Jan, Feb, Mar, ...)
- **amount**: Numeric value (no dollar sign or commas)

### Excel Workbook (WoW Analysis)

Upload the `International_Business_Unit_WOW_Analysis.xlsx` file. Two sheets are read:

**Targets sheet:**
- Looks for rows containing "George Leith -- CA+V Total" (Target Plan section)
- Reads columns for months Jan through Dec
- Used for attainment percentage calculations

**WoW Tracker sheet:**
- Rows 4-15, column A = month label
- Last column = most recent week's booked revenue
- Used for current period booked values

## HubSpot Deal Description Format

The description field uses a structured, append-only format with stage blocks:

```
[STAGE 1 -- 2026-03-14]
[PERSONA] Partner Agency
[RESEARCH] true
[MEDDIC] Metrics:ok|EconBuyer:ok|Criteria:ok|Process:partial|Pain:ok|Champion:gap
[DOCS] NDA:signed|MSA:out|SOW:out|Credit:returned|BizDev:progress|Partner:not-started
[CONTACTS] Jamie Morrison|CEO / Economic Buyer|JM
[ACTION1] Call NOW -- closes TODAY
[ACTION2] Log outcome in HubSpot
---
Research notes from Stage 1 pass go here as freeform text.
The AI synthesis reads this full block.

[STAGE 2 -- 2026-03-20]
Additional research from qualification appended here...
```

The parser reads the latest stage block for structured fields (MEDDIC, DOCS, CONTACTS) and aggregates all freeform research notes across all blocks for AI synthesis.

## Rep Photos

Place photos in `/public/reps/`:

```
george.jpg   -- George Leith
andy.jpg     -- Andy McNab
alex.jpg     -- Alex Kirkley
vendasta.png -- Vendasta logo
logo.png     -- AdCellerant white wordmark
```

## Deployment (Railway)

1. Go to [railway.app](https://railway.app) and create a new project
2. Connect your GitHub repository
3. Railway auto-detects `railway.toml` and builds with Nixpacks
4. Add all environment variables in Railway dashboard (Variables tab):
   - Set `NEXTAUTH_URL` to your Railway public URL (e.g. `https://your-app.up.railway.app`)
5. Deploy -- builds automatically on push
6. Configure Google OAuth redirect URI: `https://your-app.up.railway.app/api/auth/callback/google`

### Railway Quick Deploy (CLI)

```bash
railway login
railway init
railway up
# Then add env vars:
railway variables set GOOGLE_CLIENT_ID=...
railway variables set GOOGLE_CLIENT_SECRET=...
# ... etc
```

## Deployment (Vercel)

1. Connect the GitHub repository to Vercel
2. Set all environment variables in Vercel dashboard (Settings > Environment Variables)
3. Deploy -- builds automatically on push
4. Configure Google OAuth redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js v4 with Google OAuth + email whitelist
- **Data**: HubSpot REST API v3 (deals, notes, properties)
- **AI**: Anthropic Claude (claude-sonnet-4-5) for NL parsing, email drafting, research synthesis
- **Styling**: Tailwind CSS v3 with custom design tokens
- **State**: React useReducer with localStorage cache fallback
- **Parsing**: PapaParse (CSV), SheetJS/xlsx (Excel)

## Access Control

Only emails listed in `ALLOWED_EMAILS` can log in. Each user auto-navigates to their rep-focused view. Team view is available at `/dashboard?view=team`.
