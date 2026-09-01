# Anshul Sanghi - Personal Portfolio

An animated, responsive portfolio that presents my work across AI, security,
distributed systems, research, teaching, and technical writing.

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

## Contact

- [LinkedIn](https://www.linkedin.com/in/anshul-sanghi)
- [GitHub](https://github.com/xzaviourr)
- [Medium](https://medium.com/@anshul.sanghi)
