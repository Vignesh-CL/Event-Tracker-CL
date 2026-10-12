import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { api } from "./api";
import {
  CalendarDays,
  ClipboardList,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import "./styles.css";

const fmt = (date) =>
  date
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(date))
    : "—";
const Status = ({ children }) => (
  <span className={`status status-${String(children).toLowerCase()}`}>
    {String(children).replace("_", " ")}
  </span>
);

function Login({ onLogin }) {
  const [form, setForm] = useState({
    identifier: "admin@company.com",
    password: "Password123!",
  });
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("event_token", data.token);
      onLogin(data.user);
    } catch (e) {
      setError(e.response?.data?.message || "Unable to sign in");
    }
  };
  return (
    <main className="login">
      <div className="login-art">
        <div className="brand-mark">G</div>
        <p className="eyebrow">PEOPLE OPERATIONS / 2026</p>
        <h1>
          Bring people
          <br />
          <em>together.</em>
        </h1>
        <p>One calm workspace for the moments that make work feel human.</p>
      </div>
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">WELCOME BACK</p>
        <h2>Sign in to Gather</h2>
        <label>
          Email or employee ID
          <input
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="button primary full">
          Sign in <span>→</span>
        </button>
        <small>Employees: EMP001, EMP002, or EMP003 / Password123!</small>
      </form>
    </main>
  );
}

function Layout({ user, onLogout, children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const nav = [
    { to: "/", label: "Overview", icon: LayoutDashboard },
    { to: "/events", label: "Events", icon: CalendarDays },
    { to: "/employees", label: "People", icon: Users },
    { to: "/goodies", label: "Goodies", icon: Package },
    ...(user.role === "EMPLOYEE"
      ? [{ to: "/my-goodies", label: "My goodies", icon: Gift }]
      : [
          { to: "/reports", label: "Reports", icon: ClipboardList },
          { to: "/audit", label: "Audit trail", icon: ShieldCheck },
        ]),
  ];
  return (
    <div className="app-shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="logo">
          <span className="logo-icon">G</span>
          <span>Gather</span>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-profile">
            <div className="avatar">{user.name[0]}</div>
            <div>
              <strong>{user.name}</strong>
              <small>{user.role.toLowerCase()}</small>
            </div>
          </div>
          <button
            type="button"
            className="logout"
            onClick={() => {
              setOpen(false);
              onLogout();
              navigate("/");
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      {open && (
        <button
          className="scrim"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}
      <section className="main">
        <header>
          <button className="mobile-menu" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div className="crumb">
            Workspace <span>/</span>{" "}
            {useLocation().pathname === "/"
              ? "Overview"
              : useLocation().pathname.slice(1)}
          </div>
          <div className="header-user">
            <span className="notification-dot"></span>
            <div className="avatar small">{user.name[0]}</div>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}

function Dashboard({ user }) {
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  useEffect(() => {
    Promise.all([
      api.get("/events"),
      user.role !== "EMPLOYEE"
        ? api.get("/reports/summary")
        : Promise.resolve({ data: null }),
    ]).then(([e, s]) => {
      setEvents(e.data);
      setSummary(s.data);
    });
  }, [user.role]);
  const upcoming = events
    .filter((e) => e.status === "UPCOMING" || e.status === "ONGOING")
    .slice(0, 3);
  const stats = summary
    ? [
        { label: "Total events", value: summary.events, tone: "blue" },
        { label: "Participants", value: summary.participants, tone: "yellow" },
        { label: "Goodies out", value: summary.distributed, tone: "green" },
        { label: "Awaiting pickup", value: summary.pending, tone: "orange" },
      ]
    : [
        { label: "Upcoming", value: upcoming.length, tone: "blue" },
        { label: "My events", value: events.length, tone: "yellow" },
      ];
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TUESDAY, OCTOBER 06, 2026</p>
          <h1>Good morning, {user.name.split(" ")[0]}.</h1>
          <p className="muted">Here’s the pulse of your workplace today.</p>
        </div>
        {user.role !== "EMPLOYEE" && (
          <Link className="button primary" to="/events/new">
            + New event
          </Link>
        )}
      </div>
      <div className="stat-grid">
        {stats.map((s) => (
          <div className={`stat-card ${s.tone}`} key={s.label}>
            <span>{s.label}</span>
            <strong>{s.value ?? "—"}</strong>
            <small>Updated just now</small>
          </div>
        ))}
      </div>
      <div className="content-grid">
        <section className="panel upcoming">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">WHAT’S NEXT</p>
              <h2>Upcoming moments</h2>
            </div>
            <Link to="/events">View all →</Link>
          </div>
          {upcoming.length ? (
            upcoming.map((e) => (
              <Link className="event-row" to={`/events/${e._id}`} key={e._id}>
                <div className="date-tile">
                  <strong>{new Date(e.startDate).getDate()}</strong>
                  <small>
                    {new Date(e.startDate).toLocaleString("en", {
                      month: "short",
                    })}
                  </small>
                </div>
                <div className="event-copy">
                  <strong>{e.eventName}</strong>
                  <span>
                    {e.location} · {e.participantCount || 0} registered
                  </span>
                </div>
                <Status>{e.status}</Status>
              </Link>
            ))
          ) : (
            <div className="empty">No upcoming events yet.</div>
          )}
        </section>
        <section className="panel note-panel">
          <div className="note-icon">✦</div>
          <p className="eyebrow">A LITTLE NUDGE</p>
          <h2>Make room for the good stuff.</h2>
          <p className="muted">
            Events are more than calendar entries. They’re where culture becomes
            visible.
          </p>
          <Link to="/events/new" className="text-link">
            Plan something →
          </Link>
        </section>
      </div>
    </div>
  );
}

function Events({ user }) {
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    api.get("/events").then((r) => setEvents(r.data));
  }, []);
  const filtered = events.filter((e) =>
    e.eventName.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE CALENDAR</p>
          <h1>All events</h1>
          <p className="muted">
            The moments on the horizon, and the memories behind us.
          </p>
        </div>
        {user.role !== "EMPLOYEE" && (
          <Link className="button primary" to="/events/new">
            + New event
          </Link>
        )}
      </div>
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            placeholder="Search events"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="muted">{filtered.length} events</span>
      </div>
      <div className="event-list">
        {filtered.map((e) => (
          <Link className="event-card" to={`/events/${e._id}`} key={e._id}>
            <div className="event-card-top">
              <Status>{e.status}</Status>
              <span className="event-type">{e.eventType}</span>
            </div>
            <h2>{e.eventName}</h2>
            <p>{e.description || "A shared moment for the team."}</p>
            <div className="event-meta">
              <span>◷ {fmt(e.startDate)}</span>
              <span>⌖ {e.location || "TBA"}</span>
              <span>
                ♧ {e.participantCount || 0} / {e.maximumParticipants}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/events/directory/employees")
      .then((r) => setEmployees(r.data))
      .catch((e) =>
        setError(e.response?.data?.message || "Unable to load people"),
      );
  }, []);
  const filtered = employees.filter((employee) =>
    [employee.name, employee.employeeId, employee.department]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE TEAM</p>
          <h1>People</h1>
          <p className="muted">The three employees in your event workspace.</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input
            placeholder="Search people"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="muted">{filtered.length} employees</span>
      </div>
      <section className="panel people-list">
        {error ? (
          <p className="error">{error}</p>
        ) : (
          filtered.map((employee) => (
            <div className="participant-row" key={employee.employeeId}>
              <div className="avatar">{employee.name[0]}</div>
              <div>
                <strong>{employee.name}</strong>
                <small>
                  {employee.employeeId} · {employee.department} ·{" "}
                  {employee.email}
                </small>
              </div>
              <Status>ACTIVE</Status>
            </div>
          ))
        )}
        {!error && !filtered.length && (
          <div className="empty">No employees found.</div>
        )}
      </section>
    </div>
  );
}

function EventDetails() {
  const { pathname } = useLocation();
  const id = pathname.split("/")[2];
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get(`/events/${id}`).then((r) => setData(r.data));
  }, [id]);
  if (!data)
    return (
      <div className="page">
        <div className="panel empty large">Loading event...</div>
      </div>
    );
  const { event, participants, goodies } = data;
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{event.eventType}</p>
          <h1>{event.eventName}</h1>
          <p className="muted">
            {event.description || "A shared moment for the team."}
          </p>
        </div>
        <Status>{event.status}</Status>
      </div>
      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>Event details</h2>
          </div>
          <div className="detail-list">
            <span>
              <b>When</b>
              {fmt(event.startDate)} to {fmt(event.endDate)}
            </span>
            <span>
              <b>Where</b>
              {event.location || "To be announced"}
            </span>
            <span>
              <b>Organizer</b>
              {event.organizer || "People Operations"}
            </span>
            <span>
              <b>Capacity</b>
              {participants.length} / {event.maximumParticipants} registered
            </span>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Goodies</h2>
          </div>
          {goodies.length ? (
            goodies.map((item) => (
              <div className="inventory-row" key={item._id}>
                <div className="goodie-icon">✦</div>
                <div>
                  <strong>{item.goodie.goodieName}</strong>
                  <small>{item.allocatedQuantity} allocated</small>
                </div>
                <Status>
                  {item.distributedQuantity >= item.allocatedQuantity
                    ? "DISTRIBUTED"
                    : "PENDING"}
                </Status>
              </div>
            ))
          ) : (
            <div className="empty">No goodies allocated yet.</div>
          )}
        </section>
      </div>
      <section className="panel participant-panel">
        <div className="panel-heading">
          <h2>Participants</h2>
          <span className="muted">{participants.length} registered</span>
        </div>
        {participants.length ? (
          participants.map((p) => (
            <div className="participant-row" key={p._id}>
              <div className="avatar">{p.employee.name[0]}</div>
              <div>
                <strong>{p.employee.name}</strong>
                <small>
                  {p.employee.employeeId} · {p.employee.department}
                </small>
              </div>
              <Status>{p.attendanceStatus}</Status>
            </div>
          ))
        ) : (
          <div className="empty">No participants yet.</div>
        )}
      </section>
    </div>
  );
}

function EventCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    eventName: "",
    description: "",
    eventType: "Employee Engagement",
    startDate: "",
    endDate: "",
    location: "",
    organizer: "",
    maximumParticipants: 50,
    registrationStartDate: "",
    registrationEndDate: "",
  });
  const [error, setError] = useState("");
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/events", {
        ...form,
        maximumParticipants: Number(form.maximumParticipants),
      });
      navigate("/events");
    } catch (e) {
      setError(e.response?.data?.message || "Unable to create event");
    }
  };
  return (
    <div className="page narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MAKE IT HAPPEN</p>
          <h1>New event</h1>
          <p className="muted">Give the team something to look forward to.</p>
        </div>
      </div>
      <form className="panel form" onSubmit={submit}>
        <div className="form-grid">
          <label>
            Event name
            <input
              required
              name="eventName"
              value={form.eventName}
              onChange={change}
              placeholder="e.g. Annual Day 2026"
            />
          </label>
          <label>
            Event type
            <select name="eventType" value={form.eventType} onChange={change}>
              {[
                "Employee Engagement",
                "Celebration",
                "Workshop",
                "Sports",
                "Training",
                "Festival",
                "Team Building",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="wide">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={change}
              rows="3"
              placeholder="What should people know?"
            />
          </label>
          <label>
            Start date
            <input
              required
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={change}
            />
          </label>
          <label>
            End date
            <input
              required
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={change}
            />
          </label>
          <label>
            Location
            <input
              name="location"
              value={form.location}
              onChange={change}
              placeholder="Venue or room"
            />
          </label>
          <label>
            Organizer
            <input
              name="organizer"
              value={form.organizer}
              onChange={change}
              placeholder="Team or person"
            />
          </label>
          <label>
            Maximum participants
            <input
              required
              min="1"
              type="number"
              name="maximumParticipants"
              value={form.maximumParticipants}
              onChange={change}
            />
          </label>
          <label>
            Registration closes
            <input
              type="date"
              name="registrationEndDate"
              value={form.registrationEndDate}
              onChange={change}
            />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          <Link to="/events" className="button ghost">
            Cancel
          </Link>
          <button className="button primary">
            Create event <span>→</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function Goodies({ user }) {
  const [data, setData] = useState({ goodies: [], allocations: [] });
  const [distributions, setDistributions] = useState([]);
  const [form, setForm] = useState({
    goodieName: "",
    category: "Accessories",
    totalQuantity: 50,
  });
  const load = () =>
    Promise.all([
      api.get("/goodies"),
      user.role === "EMPLOYEE"
        ? api.get("/goodies/distributions")
        : Promise.resolve({ data: [] }),
    ]).then(([inventory, assigned]) => {
      setData(inventory.data);
      setDistributions(assigned.data);
    });
  useEffect(load, []);
  const create = async (e) => {
    e.preventDefault();
    await api.post("/goodies", {
      ...form,
      totalQuantity: Number(form.totalQuantity),
    });
    setForm({ goodieName: "", category: "Accessories", totalQuantity: 50 });
    load();
  };
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE CUPBOARD</p>
          <h1>Goodie inventory</h1>
          <p className="muted">Keep the little thank-yous moving.</p>
        </div>
      </div>
      <div className="content-grid inventory-grid">
        {user.role === "EMPLOYEE" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>My goodies</h2>
              <span className="muted">{distributions.length} assigned</span>
            </div>
            {distributions.length ? (
              distributions.map((item) => (
                <div className="inventory-row" key={item._id}>
                  <div className="goodie-icon">✦</div>
                  <div>
                    <strong>{item.goodie?.goodieName || "Goodie"}</strong>
                    <small>{item.event?.eventName || "Event"}</small>
                  </div>
                  <Status>{item.status}</Status>
                </div>
              ))
            ) : (
              <div className="empty">No goodies assigned yet.</div>
            )}
          </section>
        )}
        <section className="panel">
          <div className="panel-heading">
            <h2>Inventory</h2>
            <span className="muted">{data.goodies.length} items</span>
          </div>
          {data.goodies.map((g) => (
            <div className="inventory-row" key={g._id}>
              <div className="goodie-icon">✦</div>
              <div>
                <strong>{g.goodieName}</strong>
                <small>{g.category}</small>
              </div>
              <strong className="quantity">
                {g.totalQuantity}
                <small> total</small>
              </strong>
            </div>
          ))}
        </section>
        {user.role !== "EMPLOYEE" && (
          <form className="panel form compact" onSubmit={create}>
            <p className="eyebrow">ADD AN ITEM</p>
            <h2>New goodie</h2>
            <label>
              Name
              <input
                required
                value={form.goodieName}
                onChange={(e) =>
                  setForm({ ...form, goodieName: e.target.value })
                }
                placeholder="Canvas tote"
              />
            </label>
            <label>
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {[
                  "Apparel",
                  "Stationery",
                  "Accessories",
                  "Gift",
                  "Food",
                  "Electronics",
                  "Other",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="1"
                value={form.totalQuantity}
                onChange={(e) =>
                  setForm({ ...form, totalQuantity: e.target.value })
                }
              />
            </label>
            <button className="button primary full">Add to inventory</button>
          </form>
        )}
      </div>
    </div>
  );
}

function SimplePage({ title, eyebrow, children }) {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="muted">
            A clear view of the people and actions behind your events.
          </p>
        </div>
      </div>
      <section className="panel empty large">
        {children || "This workspace is ready for your next action."}
      </section>
    </div>
  );
}

function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.get("/reports/summary"), api.get("/reports/events")])
      .then(([summary, events]) =>
        setData({ summary: summary.data, events: events.data }),
      )
      .catch((e) =>
        setError(e.response?.data?.message || "Unable to load reports"),
      );
  }, []);
  if (error)
    return (
      <SimplePage title="Reports" eyebrow="THE NUMBERS">
        <p className="error">{error}</p>
      </SimplePage>
    );
  if (!data)
    return (
      <SimplePage title="Reports" eyebrow="THE NUMBERS">
        Loading reports...
      </SimplePage>
    );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE NUMBERS</p>
          <h1>Reports</h1>
          <p className="muted">
            A live view of event participation and goodies.
          </p>
        </div>
      </div>
      <div className="stat-grid">
        {[
          ["Events", data.summary.events, "blue"],
          ["Participants", data.summary.participants, "yellow"],
          ["Distributed", data.summary.distributed, "green"],
          ["Pending", data.summary.pending, "orange"],
        ].map(([label, value, tone]) => (
          <div className={`stat-card ${tone}`} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Current total</small>
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="panel-heading">
          <h2>Event performance</h2>
        </div>
        {data.events.map((event) => (
          <div className="participant-row" key={event._id}>
            <div>
              <strong>{event.eventName}</strong>
              <small>
                {event.registered} registered · {event.present} present
              </small>
            </div>
            <span className="muted">{event.pending} goodies pending</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function Audit() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/reports/audit")
      .then((r) => setEntries(r.data))
      .catch((e) =>
        setError(e.response?.data?.message || "Unable to load audit trail"),
      );
  }, []);
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE PAPER TRAIL</p>
          <h1>Audit trail</h1>
          <p className="muted">Recent actions taken in the workspace.</p>
        </div>
      </div>
      <section className="panel">
        {error ? (
          <p className="error">{error}</p>
        ) : entries.length ? (
          entries.map((entry) => (
            <div className="participant-row" key={entry._id}>
              <div className="avatar">{entry.user?.name?.[0] || "?"}</div>
              <div>
                <strong>{entry.description || entry.action}</strong>
                <small>
                  {entry.user?.name || "Unknown user"} · {fmt(entry.createdAt)}
                </small>
              </div>
              <span className="muted">{entry.entityType}</span>
            </div>
          ))
        ) : (
          <div className="empty">No actions recorded yet.</div>
        )}
      </section>
    </div>
  );
}
function App() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("event_token");
    if (token)
      api
        .get("/auth/me")
        .then((r) => setUser(r.data))
        .catch(() => localStorage.removeItem("event_token"));
  }, []);
  if (!user) return <Login onLogin={setUser} />;
  const logout = () => {
    localStorage.removeItem("event_token");
    setUser(null);
  };
  return (
    <Layout user={user} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/events" element={<Events user={user} />} />
        <Route path="/events/new" element={<EventCreate />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/goodies" element={<Goodies user={user} />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/my-goodies" element={<Goodies user={user} />} />
        <Route path="*" element={<Dashboard user={user} />} />
      </Routes>
    </Layout>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
