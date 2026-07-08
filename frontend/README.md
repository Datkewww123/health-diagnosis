# Disease Symptom — Frontend (Login / Signup)

This is a minimal React + Vite frontend that provides Login and Signup pages for your project "A website to help users understand their symptoms and receive initial health advice".

Project structure

- `src/pages/Login.jsx` — login form and client-side logic
- `src/pages/Signup.jsx` — signup form
- `src/api/auth.js` — small wrapper that posts to `${VITE_API_URL}/auth/*`
- `.env.example` — set `VITE_API_URL` to the backend API base URL

This project also supports a built-in mock mode so you can run the UI without any backend available. See "Mock mode" below.

Quick start (Windows PowerShell)

1. Install dependencies

```powershell
cd "D:/Đồ án web/frontend"
npm install
```

2. Create `.env` from the example and set your backend URL

```powershell
copy .env.example .env
# then edit .env and set VITE_API_URL to your API (for example: https://your-api.example.com)
```

3. Run dev server

```powershell
npm run dev
```

By default the app will POST to `${VITE_API_URL}/auth/login` and `${VITE_API_URL}/auth/signup`. Adjust the endpoints in `src/api/auth.js` if your API uses different paths.

## Mock mode

If you don't yet have a backend, run the frontend in mock mode by either leaving `VITE_API_URL` empty in `.env` or setting `VITE_USE_MOCK=true`.

Example `.env` for mock mode:

```text
# Use mock backend when developing locally
VITE_USE_MOCK=true
VITE_API_URL=
```

Mock login credentials (for demo):

- Email: `user@example.com`
- Password: `password`

Mock signup / forgot-password demo:

- For the mock demo the example user uses phone `0123456789`.
- When signing up locally (mock) include a phone number; the frontend will send it to the backend as part of signup.

When switching to the real backend later, set `VITE_API_URL` to the backend base URL (for example `https://api.your-backend.com`) and remove or set `VITE_USE_MOCK=false`. The frontend code reads `VITE_API_URL` at build/dev start, so restart the dev server after changes.

Next steps / suggestions

- Create a GitHub repo for this frontend and push these files. Use the other repository for the backend and set `VITE_API_URL` accordingly.
- Add form field constraints and better UX (loading spinners, redirects after login).
- Deploy the frontend (Netlify / Vercel / GitHub Pages) and backend (Heroku / Railway / Render / VPS) as required.
- Add PPT slides describing architecture, endpoints, and demo flows.

If you want, I can also:

- initialize a Git repo and create the two GitHub repositories (frontend and backend) with suggested README and remote URLs,
- or create a simple demo backend mock so you can test the UI locally without the other repo.

## Vercel deployment

This project is ready to deploy on Vercel. I've added a `vercel.json` so Vercel will run `npm run build` and serve the `dist` directory as a static site. To deploy:

1. Push this repository to GitHub (or another Git provider)
2. In Vercel, import the project and choose the frontend repository
3. Use the default Build Command: `npm run build` and the Output Directory: `dist` (these are pre-configured in `vercel.json`)
4. Add the environment variable `VITE_API_URL` in the Vercel dashboard to point to your backend base URL (e.g. `https://your-backend.example.com`)

Notes:

- Keep `VITE_API_URL` empty or set `VITE_USE_MOCK=true` for mock mode.
- Do not hardcode secrets in `vercel.json`; set them in Vercel's Environment Variables section.
