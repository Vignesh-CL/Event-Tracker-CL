# Office Event & Goodie Tracker

MERN stack application for internal event registration, participation, inventory, and goodie distribution.

The workflow is intentionally role-based:

- System administrators can create, edit, cancel, and delete events, create,
  edit, and delete goodies, and review registrations and distributions.
- Event coordinators can create events and manage operational registrations and
  goodies, but cannot edit, cancel, or delete an event after it is posted.
- Employees can see the event calendar and event details, register for events,
  and see only the goodies they are eligible for. When a goodie is assigned or
  distributed, it appears in the employee's dashboard and My goodies view.

Goodies can be created for everyone or restricted to a selected group of active
employees. Every goodie must be posted for an upcoming or ongoing event; the
selected event is shown in the inventory and its allocation is created
automatically. The People directory is not exposed as a standalone portal
section; employee selection is available only inside the goodie workflow.

Administrators and event coordinators can distribute an event goodie by
selecting the event, goodie, and a registered eligible employee. The employee's
dashboard then shows the goodie as received.

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
