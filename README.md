# Edvora

Edvora is a modern university admissions workspace for students planning international study. It brings university search, application planning, document tracking, scholarships, budgeting, and destination research into one focused dashboard.

## Features

- Personalized dashboard with application progress, deadlines, recommended universities, and next steps.
- University search with detailed filters for country, program, program level, tuition, funding, tests, GPA scale, language scores, research focus, ranking, and university type.
- Global ROR institution directory with 24,000+ active education organizations, official domains, source metadata, and automated updates.
- U.S. degree-level, subject, and institution-type filters backed by the latest published NCES/IPEDS program-offering files.
- Wishlist for saving, comparing, and organizing target universities.
- Full application workspace with editable applicant details, education history, statuses, checklists, linked documents, notes, and university portal access.
- Document center for managing common admissions materials.
- Scholarship, budget, destination, consultation, exam prep, and community pages.
- Responsive interface designed for desktop and mobile use.
- SPA routing configured for Vercel deployments.

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Radix UI primitives
- Lucide React icons
- Recharts

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run TypeScript checks:

```bash
npm run typecheck
```

Refresh the global ROR catalog:

```bash
npm run data:sync
```

Refresh the current U.S. IPEDS program index:

```bash
npm run data:sync:ipeds
```

The scheduled GitHub workflow refreshes both catalog sources automatically. The ingestion architecture for program, tuition, requirement, deadline, and scholarship facts is documented in `docs/university-data-pipeline.md`.

## Project Structure

```text
src/
  app/
    components/       App layout, pages, auth, and shared UI components
    data/             Mock university, application, scholarship, and user data
    lib/              Local storage and validation helpers
    providers/        Auth and app data providers
  assets/             Static project assets
  styles/             Global styles and page-specific styles
```

## Deployment

The app is configured for Vercel with `vercel.json`, which rewrites all routes to `index.html` so direct links like `/search`, `/dashboard`, and `/applications` work in production.

Recommended Vercel settings:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

## License

This project is licensed under the terms in `LICENSE`.