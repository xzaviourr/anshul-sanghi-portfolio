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

This is a client-only single-page site. `main.tsx` mounts the React application;
`App.tsx` contains the portfolio sections and content; and `index.css` owns the
visual system, animations, breakpoints, and reduced-motion behavior. Vite
type-checks and bundles the site into static assets suitable for Vercel or any
static host.

## Getting started

### Prerequisites

- Node.js 18 or newer
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
| `npm run preview` | Preview the production build locally |

## Project structure

```text
.
├── public/          # Resume and organization logos
├── src/
│   ├── App.tsx      # Portfolio content and component structure
│   ├── index.css    # Design system, responsive layouts, and animation
│   └── main.tsx     # React entry point
├── index.html
└── vite.config.ts
```

## Production build

```bash
npm run build
npm run preview
```

Vite writes the optimized production bundle to `dist/`.

The production build is the project's validation command:

```bash
npm run build
```

There is currently no automated browser or unit-test suite.

## Project status and limitations

This is an actively maintained personal site. Portfolio content is authored
directly in `src/App.tsx`; there is no CMS or server-side API. The downloadable
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
