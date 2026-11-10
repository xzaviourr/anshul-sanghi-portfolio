# Anshul Sanghi - Personal Portfolio

An animated, responsive portfolio that presents my work across AI, security,
distributed systems, research, teaching, and technical writing.

[**View the live portfolio**](https://anshul-sanghi-portfolio.vercel.app)

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

The site combines a playful, cartoon-inspired visual language with an
`Anshul.OS` idea-reactor hero, an achievement wall, an experience timeline,
selected projects, education, writing, and ways to get in touch.

## Highlights

- Custom animated hero built with inline SVG and CSS
- Professional experience at Microsoft, Paytm, and Analytics Valley
- Education at IIT Bombay and IIIT Gwalior
- Achievement wall featuring competitive programming and academic milestones
- Selected AI, cloud, and systems projects
- Responsive layouts designed for desktop, tablet, and mobile
- Reduced-motion support for accessible browsing
- Downloadable resume and links to LinkedIn, GitHub, and Medium

## Tech stack

- React 18
- TypeScript
- Vite
- Custom CSS, SVG illustration, and animation

No component or animation libraries are used.

## Architecture

The portfolio is a client-rendered single-page site. `main.tsx` mounts the React application;
`App.tsx` contains the portfolio sections and content; and `index.css` owns the
visual system, animations, breakpoints, and reduced-motion behavior. Vite
type-checks and bundles the site into static assets suitable for Vercel or any
static host. The separate `/kirti` page uses Vercel Functions and private
Vercel Blob storage for shared, durable notes.

## Kirti's corner

This page is a personal gift for Kirti from Anshul, with notes from the people
who love her. The greeting, dedication, composer, footer, and link-preview
metadata are written specifically for her, not for a generic multi-person board.
The compact scrapbook-style introduction pairs her greeting with a handwritten
letter from Anshul and a small overlapping envelope, keeping the notes close by.
The page is called **Kirti's corner**: her own small place on Anshul's website.
The understated dedication reads, "This little corner of my world is yours."

The standalone page is at **https://anshulsanghi.in/kirti** after deployment.
It is not linked from the portfolio. Guests can leave their name, a short note,
and choose a pastel note colour without signing in. Text-only notes are welcome;
guests can optionally attach either one curated GIF or one photo, never both.
Choosing a new attachment replaces the other kind only after a successful selection.
Names appear as handwritten signatures at the bottom right, in the same ink
colour as the note text.
All notes appear together on the board, without filters or sorting controls.
There is no refresh button or note counter; visitors can copy the share link
and reload the page to see newly added notes from other guests.
No sample wishes are presented as real submissions.

### Photo attachments

- One JPG, PNG, or WebP photo per note; original files can be up to 10 MB
  (and 50 megapixels).
- The browser previews the photo, resizes it to at most 1600 pixels per edge,
  and compresses the upload to at most 1 MB. Transparent areas become white.
- Guests can change or remove their photo before sending. Invalid files produce
  a visible error; the note is not silently posted without its attachment.
- Photos appear as slightly tilted instant-camera prints, with warm white paper,
  a generous bottom border, and a soft shadow. The composer previews the same frame.
- The server independently checks size, file signatures, and actual decoding,
  then uses Sharp to re-encode a still WebP image and strip EXIF/location metadata.
  Raw filenames and original photo bytes are not retained.
- SVG, HEIC, PDFs, and animated image uploads are not supported. The existing
  curated GIF picker is available as an alternative to a photo upload.
- Private photo files are stored under `wishboard/v1/images/`. Note JSON
  contains only a same-origin image URL, not base64 data or a public Blob URL.
  `/api/wish-image` reads and serves the private image without exposing the
  storage token. It is still public to anyone with that image link.

Uploads work with the same Blob store and token as notes; no additional service
or environment variable is needed. Each photo uses an additional Blob write,
storage space, and image-read operations, all of which count toward Hobby quotas.

### One-time Vercel setup (no Redis or separate database)

1. Open your project in the Vercel dashboard.
2. Go to **Storage → Create Database → Blob** (or create a Blob store from the
   Storage dashboard and connect it to this project).
3. Choose **Private** access and connect the store to **Production**. Connect
   Development too if you want to test real storage locally.
4. Verify that Vercel added the server-only `BLOB_READ_WRITE_TOKEN` environment
   variable. Never give it a `VITE_` prefix.
5. Redeploy the project, then open `/kirti` and submit a test note.

The route has its own `kirti.html` entry with personalised link-preview metadata.
Vercel rewrites `/kirti` and `/kirti/` to that entry without changing the shared
URL. Old `/wishboard`, `/wishboard/`, and `/wishboard.html` links permanently
redirect to `/kirti`; the old management links redirect to `/kirti/manage`.
Local development also replaces legacy URLs while preserving query strings
and fragments. The homepage remains unchanged and has no link to this page.

The internal API URLs, `wishboard/v1/` Blob paths, and environment variable names
are intentionally unchanged. Renaming the page does not migrate or lose notes,
photo links, or existing storage/admin configuration.

Blob is available on the free Hobby plan within its quotas. At the time of this
implementation, the included allowances are 1 GB of storage, 10,000 simple
operations, and 2,000 advanced operations per month. Check the
[current Vercel limits](https://vercel.com/docs/vercel-blob/usage-and-pricing)
before sharing widely. Exceeding Hobby limits temporarily blocks Blob access
rather than automatically charging for overages.

The SDK's pinned transitive Zod dependency is overridden to a compatible patched
4.x release in `package.json`; keep that override until the upstream SDK chain
includes the patched version.

Each wish is a separate private JSON file under `wishboard/v1/notes/`. Wishes
survive server restarts and deployments; simultaneous submissions don't
overwrite a shared file. Submission IDs prevent retries from making duplicate
notes. The board displays the newest 500 wishes; older files are retained, not
deleted. Each board load lists saved files and reads the newest notes in batches
of ten, so reads count toward the free operation allowance.

The page and API are public to anyone with the URL. `noindex` discourages search
engines; it is **not** access control. There is no guest login, identity
verification or automatic moderation. The owner can remove unwanted notes from
the password-protected management page described below. To remove a note manually,
delete its JSON file **and any matching image file** in the Blob dashboard, then
reload the page. Image filenames start with the note's ID. A failed note write
can leave an unreferenced image; a retry reuses it safely, or the owner can remove
it after confirming there is no corresponding note. The API limits
input length and GIF choices, and applies a best-effort limit of five submission
attempts per visitor per ten minutes **per function instance**. For wider public
sharing, add Vercel Firewall rate limits; instance-local throttling is not
global abuse protection.

The page shows an explicit error if storage is unconfigured or unavailable. It
does not fall back to browser storage or claim unsaved wishes were saved.

### Private note management

Open `/kirti/manage` directly. There are no links to it from the portfolio
or Kirti's board. The URL is unlisted, **not an access-control mechanism**:
all listing and deletion requests require a separate admin password.

1. Generate a long random password, for example with `openssl rand -hex 32`.
2. Set `WISHBOARD_ADMIN_PASSWORD` in the Vercel project's **Production**
   environment and redeploy. It must be 16-256 characters. Never prefix it with
   `VITE_`, commit it, or put it in a URL. Add a separate Development value to
   test with `vercel dev`.
3. Open `/kirti/manage`, enter the password, and select **Unlock notes**.
4. Review the names, messages, dates, and attachments. Use **Load more notes**
   to access additional pages, including notes older than the public board's
   500-note display limit. **Reload list** fetches the latest notes.
5. Select **Delete note**, then **Delete permanently** to confirm. The server
   deletes the note JSON, its photo, and any leftover photo uploads for that
   note ID from the same private Blob store. GIFs are external GIPHY media;
   deleting a note removes its GIF selection, not the external GIF.

Deletion is permanent. A failed or interrupted deletion displays an error;
retrying also cleans up any photo left by a partial deletion. Other visitors
need to reload their boards to see removals. **Lock page** or reload to clear
the admin password; it is kept only in React memory, not local storage or a
cookie. Missing/short password configuration disables the management API.
Public guests can still leave notes without signing in.

The management API and page have no-store/noindex protections. The password
is sent only in an Authorization header to the same-origin management API,
over HTTPS in production. Management operations also count toward Blob quotas.
Vite's demo board does not authenticate or persist management operations;
use `vercel dev` with the Development store for a real local management test.

### Local development of Kirti's corner

To preview the design immediately, without connecting any storage:

```bash
npm run dev
```

Open **http://localhost:3000/kirti?demo=1**. This development-only preview
includes 12 sample notes with varied lengths, four note colours, three GIFs,
and an instant-print-style demo flower photo from Unsplash. Like the GIF previews,
the demo photo needs an internet connection.
You can try the composer, GIFs, photo uploads, and colours without making API
requests. Photos attached in this mode are browser-only previews, not stored
files.
Test submissions exist only on the current page; reloading the page restores
the original 12 samples. The preview does not touch Blob
storage, and sample notes are excluded from production builds.

`npm run dev` serves the UI and portfolio, but not Vercel Functions. Without
`?demo=1`, Kirti's corner uses its real API and reports connection failures
explicitly. For the complete shared page, use Vercel CLI (Node.js 20+),
link this project, and pull its
Development environment variables:

```bash
vercel link
vercel env pull .env.local
vercel dev
```

Use a separate Development Blob store to avoid mixing test and production notes.
Copying `.env.example` alone does not provision storage.

### Verifying shared storage before sharing the link

`npm test` covers durable note/photo reads after recreating the server, concurrent
submissions, duplicate retries, interrupted writes, and explicit storage errors.
It also runs the installed `@vercel/blob` SDK against a loopback HTTP fixture:
private upload headers, immutable filenames, paginated listings, uncached reads,
and WebP delivery are checked using the SDK's real request/response handling.
These automated tests do not contact a live Blob store.

After connecting the private store and deploying, verify the actual deployment:

1. Open `/api/wishes`; it must return JSON with a `wishes` array, not a 404,
   an HTML page, or a storage-configuration error.
2. Open `/kirti` **without `?demo=1`**. Submit a text-only note, a note with
   a GIF, and a note with a photo. Each should appear only once.
3. Open the board in another browser or private window. All three notes and
   the photo must load there as well.
4. Redeploy, then reload the board. The notes and photo must still be present.
5. In the Blob dashboard, check that the photo note has a JSON file in
   `wishboard/v1/notes/` and a matching WebP in `wishboard/v1/images/`.
   Delete both files when removing the test photo note.

Local preview success is not proof of cloud persistence. The production Blob
connection, permissions, quotas, and deployed functions need this final live check.

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm

### Run locally

```bash
git clone https://github.com/xzaviourr/anshul-sanghi-portfolio.git
cd anshul-sanghi-portfolio
npm install
npm run dev
```

The development server runs at
[http://localhost:3000](http://localhost:3000).

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build |
| `npm test` | Run page routing, API, and storage tests |
| `npm run preview` | Preview the production build locally |

## Project structure

```text
.
├── public/          # Resume and organization logos
├── api/wishes.mjs   # Public Vercel Function for Kirti's notes
├── server/          # Private Blob storage adapter
├── src/
│   ├── App.tsx      # Portfolio content and component structure
│   ├── index.css    # Design system, responsive layouts, and animation
│   ├── main.tsx     # React entry point
│   └── wishboard/   # Kirti's corner UI and shared constraints (internal name)
├── index.html
├── kirti.html
└── vite.config.ts
```

## Production build

```bash
npm run build
npm run preview
```

Vite writes the optimized production bundle to `dist/`.

Automatic Vercel Git deployments are disabled only for `feature/kirti-corner`
in `vercel.json`. This branch preserves the already-deployed changes without
starting another Preview build. Other branches, including `main`, keep their
normal deployment behavior; merging into `main` can still trigger a deployment.

The production build is the project's validation command:

```bash
npm run build
```

`npm test` runs the API and storage tests using Node's built-in test runner.

## Project status and limitations

This is an actively maintained personal site. Portfolio content is authored
directly in `src/App.tsx`; there is no CMS. Only Kirti's corner has a server-side
API. The downloadable
resume and organization imagery are served from `public/`. Animation respects
the visitor's reduced-motion preference, but significant visual changes should
still be checked manually on desktop and mobile before deployment.

## License

The source code is available under the [MIT License](./LICENSE). Personal
biographical content, logos, and the resume remain the property of their
respective owners.

## Contact

- [LinkedIn](https://www.linkedin.com/in/anshul-sanghi)
- [GitHub](https://github.com/xzaviourr)
- [Medium](https://medium.com/@anshul.sanghi)
