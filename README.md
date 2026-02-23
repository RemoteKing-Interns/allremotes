# AllRemotes (Next.js)

This project runs on Next.js (App Router).

## Available Scripts

In the project directory, you can run:

## Address autocomplete (Checkout)

This app supports address autocomplete on the Checkout page via Geoapify.

- Create a `.env.local` file and set `NEXT_PUBLIC_GEOAPIFY_API_KEY`.
- Restart `npm run dev` after changing env vars.

### `npm run dev`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production.

## Deploy to Vercel

- Set Vercel Environment Variables:
  - `MONGODB_URI` (required for persistence)
  - `MONGODB_DB` (optional; default `allremotes`)
  - `NEXT_PUBLIC_GEOAPIFY_API_KEY` (optional)
  - `NEXT_PUBLIC_API_BASE` (optional; leave empty for same-origin `/api`)
- Deploy as a standard Next.js project (no additional config required).
