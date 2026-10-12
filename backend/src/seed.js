import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Event, Goodie } from './models.js';

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_tracker');
await Promise.all([User.deleteMany({}), Event.deleteMany({}), Goodie.deleteMany({})]);

const passwordHash = await bcrypt.hash('Password123!', 10);
await User.insertMany([
  { employeeId: 'ADMIN001', name: 'System Administrator', email: 'admin@company.com', department: 'People Ops', role: 'ADMIN', passwordHash },
  { employeeId: 'COORD001', name: 'Event Coordinator', email: 'coordinator@company.com', department: 'People Ops', role: 'COORDINATOR', passwordHash },
  { employeeId: 'EMP001', name: 'Vignesh', email: 'vignesh@company.com', department: 'Engineering', role: 'EMPLOYEE', passwordHash },
  { employeeId: 'EMP002', name: 'Shubham', email: 'shubham@company.com', department: 'Design', role: 'EMPLOYEE', passwordHash },
  { employeeId: 'EMP003', name: 'Prajwal', email: 'prajwal@company.com', department: 'Sales', role: 'EMPLOYEE', passwordHash },
]);

await Event.insertMany([
  { eventName: 'Annual Day 2026', description: 'A full-company celebration with food, games, and awards.', eventType: 'Celebration', startDate: new Date('2026-11-20'), endDate: new Date('2026-11-20'), location: 'Harbor Hall', organizer: 'People Operations', maximumParticipants: 300, registrationStartDate: new Date('2026-10-01'), registrationEndDate: new Date('2026-11-10') },
  { eventName: 'Product Lab Workshop', description: 'A hands-on afternoon for teams to explore new ideas.', eventType: 'Workshop', startDate: new Date('2026-10-24'), endDate: new Date('2026-10-24'), location: 'Studio 4B', organizer: 'Engineering', maximumParticipants: 60, registrationEndDate: new Date('2026-10-18') },
  { eventName: 'Sports Day', description: 'Friendly competition and an afternoon away from the desk.', eventType: 'Sports', startDate: new Date('2026-09-12'), endDate: new Date('2026-09-12'), location: 'Riverside Grounds', organizer: 'Culture Club', maximumParticipants: 120 },
]);

await Goodie.insertMany([
  { goodieName: 'Company T-Shirt', category: 'Apparel', totalQuantity: 100, description: 'Gather crew shirt' },
  { goodieName: 'Canvas Tote', category: 'Accessories', totalQuantity: 50, description: 'Reusable event tote' },
  { goodieName: 'Coffee Mug', category: 'Gift', totalQuantity: 75, description: 'Gather coffee mug' },
]);

console.log('Seed complete. Employee login: EMP001, EMP002, or EMP003 with Password123!');
await mongoose.disconnect();
