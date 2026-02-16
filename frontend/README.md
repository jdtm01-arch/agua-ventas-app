Agua Ventas - Frontend (minimal)

How to run (locally):

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Start dev server:

```bash
npm run dev
```

Notes:
- The frontend expects the API at `http://localhost:8000/api`. You can set `VITE_API_URL` in `.env` inside the `frontend` folder to change it.
- This is a minimal demo: `Login`, `Crear Cliente`, `Crear Venta` components. Tokens are stored in `localStorage`.
