# Vocab Master

Vocab Master is a dual-platform vocabulary learning suite consisting of a **local-first Java Swing desktop application** and a **Next.js web application** — both powered by Google's Gemma 3 27B AI model for intelligent vocabulary enhancement.

---

## Project Structure

```
vocab-master/
├── src/                          # Java desktop application source
│   └── main/java/com/vocabmaster/
│       ├── SwingApp.java         # Main entry point (Swing UI)
│       ├── VSystem.java          # Core vocabulary data & logic engine
│       ├── Vocab.java            # Vocabulary data model
│       ├── AiEnhancer.java       # Google Gemma AI integration
│       ├── GameDialog.java       # Practice/quiz game UI
│       ├── LanguageManager.java  # i18n / language support
│       ├── SettingsDialog.java   # Settings panel
│       ├── PresetLists.java      # Built-in vocabulary presets
│       └── AboutDialog.java      # About dialog
├── web-app/                      # Next.js web application
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── dashboard/        # Main vocabulary dashboard
│   │   │   ├── login/            # Auth login page
│   │   │   ├── signup/           # Auth signup page
│   │   │   └── api/
│   │   │       ├── ai-enhance/   # AI enhancement API route
│   │   │       └── auth/callback # Supabase OAuth callback
│   │   ├── components/
│   │   │   └── VocabDashboard.tsx # Core dashboard component
│   │   ├── lib/supabase/         # Supabase client & server helpers
│   │   └── middleware.ts         # Auth guard middleware
│   ├── schema.sql                # Supabase database schema
│   └── package.json
├── icons/                        # App icons (PNG, ICO, ICNS)
├── pom.xml                       # Maven build configuration
└── .github/workflows/
    └── release.yml               # CI/CD: auto-build & release on git tag
```

---

## Features

### Desktop App (Java Swing)
- **Practice Mode** — Test vocabulary in Sequential, Reversed, or Random order
- **Wrong-Word Retry Loop** — Automatically tracks mistakes and re-tests failed words until a perfect score is achieved
- **AI Enhancement** — Uses Google Gemma 3 27B to generate precise definitions and natural example sentences in bulk
- **AI Search Fallback** — Search for any missing word through Gemma AI and add it to your list
- **Example Sentence Support** — 4-column UI cleanly displays term, definition, notes, and examples
- **PDF Export** — Produce perfectly paginated PDF study guides via HTML styling
- **CSV Import/Export** — Compatible with Microsoft Excel
- **MDX Import** — Import raw terms from MDX database tab-delimited exports
- **Smart UI Truncation** — Double-click any cell to expand long definitions in a modal overlay
- **Local-First Storage** — No database needed; all data is stored in `~/.vocabapp/`

### Web App (Next.js)

[Open Vocab Master](https://vocab-master-sand.vercel.app/) · [Web setup and deployment guide](web-app/README.md)

- **User Authentication** — Secure sign-up/login powered by Supabase Auth
- **Vocabulary Dashboard** — Create lists, add/edit/delete words, move words between lists, search, and sort
- **AI Enhancement API** — Server-side Gemma 3 27B integration for batch word enrichment
- **Cloud Sync** — All vocabulary data persisted in Supabase (PostgreSQL) with Row Level Security
- **CSV Import/Export** — Validated CSV import with duplicate detection and filtered export
- **Practice** — Sequential, reverse, and shuffled recall with missed-word retry
- **Browser Demo** — Try the workspace without an account; sample data stays in your browser
- **Responsive UI** — Built with Tailwind CSS v4

---

## Quick Download (Desktop App)

| Platform | Download |
|----------|----------|
| **Windows** | [Download `.exe` installer](https://github.com/CS721127/vocab-master/releases/latest) |
| **macOS** | [Download `.dmg` binary](https://github.com/CS721127/vocab-master/releases/latest) |
| **Portable** | `.zip` App-Images available on the release page |

> **Windows note:** If Windows Defender shows "Windows protected your PC", click **More Info → Run Anyway**.  
> **macOS note:** If Gatekeeper blocks the app, right-click the `.app` and choose **Open**.

*No Java installation required — the JRE is fully bundled into the installer.*

---

## Developer Setup

### Prerequisites

| Tool | Version |
|------|---------|
| JDK | 21+ |
| Apache Maven | 3.8+ |
| Node.js | 18+ |
| npm | 9+ |

---

### Desktop App (Java)

**Build the fat JAR:**
```bash
mvn clean package
```
This produces `target/vocab-master-1.0.0.jar` — a self-contained executable JAR.

**Run directly:**
```bash
java -jar target/vocab-master-1.0.0.jar
```

**Native packaging** (`.exe`, `.dmg`, etc.) is handled automatically by GitHub Actions when you push a `v*` tag. See [CI/CD](#cicd--releases) below.

**Configure AI Features:**
1. Open the app → **File → Settings**
2. Visit [Google AI Studio](https://aistudio.google.com/) to get a free API key
3. Paste the key (`AIza...`) into the **Gemma API Key** field and click **Save**

---

### Web App (Next.js)

**Install dependencies:**
```bash
cd web-app
npm install
```

**Set up environment variables:**

Create a `.env.local` file inside `web-app/`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMMA_API_KEY=your_google_gemma_api_key
```

**Set up the Supabase database:**

For a new database, run `web-app/schema.sql`, then `web-app/migrations/20261101_web_release.sql` in Supabase SQL Editor. Existing databases need only the migration. See `web-app/README.md` for account redirect URLs and Vercel configuration.

**Run the development server:**
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Schema

The web app uses two tables in Supabase (PostgreSQL):

**`lists`** — Groups of vocabulary
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users` |
| `name` | TEXT | List name |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**`words`** — Individual vocabulary entries
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References `auth.users` |
| `list_id` | UUID | References `lists` |
| `term` | TEXT | Vocabulary term |
| `definition` | TEXT | Definition |
| `example` | TEXT | Example sentence |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

Row Level Security is enabled on both tables — users can only access their own data.

---

## AI Integration

Both the desktop and web apps use the **Google Gemma 3 27B** model via the Google AI Studio API.

- Words are processed in **batches of 10** for efficiency
- The AI generates an improved definition and a natural example sentence for each term
- Web requests are limited to 10 owned words and 5 requests per user per minute; updates are saved atomically
- The desktop app calls the API directly from the Java client
- The web app proxies the call through a secure Next.js API route (`/api/ai-enhance`) so the API key is never exposed to the browser

---

## CI/CD & Releases

The repository includes a GitHub Actions workflow (`.github/workflows/release.yml`) that automatically builds and releases native installers when a version tag is pushed.

**To trigger a release:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

**What it builds:**

| Platform | Artifacts |
|----------|-----------|
| macOS | `.dmg` installer, `.zip` App-Image |
| Windows | `.exe` installer, `.msi` installer, `.zip` App-Image |

The workflow runs on both `macos-latest` and `windows-latest` runners in parallel, using JDK 21 (Temurin) and `jpackage` for native packaging.

---

## Data Storage

### Desktop App
- Vocabulary lists: `~/.vocabapp/<listname>_events.dat`
- User settings: `~/.vocabapp/config.properties`
- True local-first — no internet connection required (except for AI features)

### Web App
- All data stored in Supabase (PostgreSQL)
- Authentication managed by Supabase Auth
- Full cloud sync across devices

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop UI | Java 21, Swing |
| Desktop Build | Apache Maven + maven-shade-plugin |
| Desktop Packaging | `jpackage` (via GitHub Actions) |
| Web Framework | Next.js 16 (App Router) |
| Web Language | TypeScript |
| Web Styling | Tailwind CSS v4 |
| Web Auth & DB | Supabase (PostgreSQL + Auth) |
| AI Model | Google Gemma 3 27B (via Google AI Studio) |
| CSV Parsing | PapaParse (web), custom Java parser (desktop) |
| Deployment | Vercel (web app), GitHub Releases (desktop) |

---

## License

This project is under Apache 2.0.