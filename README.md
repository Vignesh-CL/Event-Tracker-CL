# Office Event & Goodie Tracker

MERN stack application for internal event registration, participation, inventory, and goodie distribution.

## Run locally

1. Install MongoDB and start it locally.
2. Copy `backend/.env.example` to `backend/.env` and adjust values if needed.
3. Install and seed the API:

```powershell
cd backend
npm install
npm run seed
npm run dev
```

4. In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. API docs are available through the health endpoint at `http://localhost:5000/api/health`.

Seed logins use `Password123!` for every account:

- Admin: `admin@company.com`
- Coordinator: `coordinator@company.com`
- Employees: `EMP001` / `vignesh@company.com`, `EMP002` / `shubham@company.com`, `EMP003` / `prajwal@company.com`
