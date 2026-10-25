import { Router } from 'express'; import { Goodie, Event, EventGoodie, Distribution, Participant, User, AuditLog } from '../models.js'; import { auth, roles } from '../middleware.js';
const router = Router(); router.use(auth);
router.get('/', async (req, res, next) => { try { const filter = req.user.role === 'EMPLOYEE' ? { $or: [{ eligibility: 'EVERYONE' }, { eligibleEmployees: req.user._id }] } : {}; const query = Goodie.find(filter).sort({ createdAt: -1 }); if (req.user.role !== 'EMPLOYEE') query.populate('eligibleEmployees', 'employeeId name department'); const goodies = await query; const allocations = await EventGoodie.find({ goodie: { $in: goodies.map((goodie) => goodie._id) } }).populate('event goodie'); res.json({ goodies, allocations }); } catch (e) { next(e); } });
router.get('/tracker', roles('ADMIN', 'COORDINATOR'), async (_req, res, next) => { try { res.json(await Distribution.find().populate('event goodie employee distributedBy', 'eventName goodieName name employeeId').sort({ createdAt: -1 })); } catch (e) { next(e); } });
router.get('/eligible-employees', roles('ADMIN', 'COORDINATOR'), async (req, res, next) => { try {
  const { event: eventId, goodie: goodieId } = req.query;
  if (!eventId || !goodieId) return res.status(400).json({ message: 'Event and goodie are required' });
  const goodie = await Goodie.findById(goodieId).select('eligibility eligibleEmployees');
  if (!goodie) return res.status(404).json({ message: 'Goodie not found' });
  const eligibleUsers = await User.find(goodie.eligibility === 'SELECTED' ? { _id: { $in: goodie.eligibleEmployees }, role: 'EMPLOYEE', isActive: true } : { role: 'EMPLOYEE', isActive: true }).select('_id');
  const participants = await Participant.find({ event: eventId, registrationStatus: { $ne: 'CANCELLED' }, employee: { $in: eligibleUsers.map((user) => user._id) } }).populate('employee', 'employeeId name department email');
  const distributed = await Distribution.find({ event: eventId, goodie: goodieId }).select('employee');
  const distributedIds = new Set(distributed.map((item) => item.employee.toString()));
  res.json(participants.filter((participant) => !distributedIds.has(participant.employee._id.toString())).map((participant) => participant.employee));
} catch (e) { next(e); } });
router.post('/', roles('ADMIN', 'COORDINATOR'), async (req, res, next) => { try {
  const { event: eventId, eligibility = 'EVERYONE', eligibleEmployees = [], ...data } = req.body;
  if (!eventId) return res.status(400).json({ message: 'Choose an upcoming or ongoing event for this goodie' });
  const event = await Event.findById(eventId);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  event.refreshStatus();
  if (!['UPCOMING', 'ONGOING'].includes(event.status)) return res.status(400).json({ message: 'Goodies can only be posted for upcoming or ongoing events' });
  if (!['EVERYONE', 'SELECTED'].includes(eligibility)) return res.status(400).json({ message: 'Choose a valid eligibility option' });
  const employeeIds = [...new Set(eligibleEmployees)];
  if (eligibility === 'SELECTED' && !employeeIds.length) return res.status(400).json({ message: 'Select at least one eligible employee' });
  const validEmployees = await User.find({ _id: { $in: employeeIds }, role: 'EMPLOYEE', isActive: true }).select('_id');
  if (validEmployees.length !== employeeIds.length) return res.status(400).json({ message: 'One or more selected employees are unavailable' });
  const item = await Goodie.create({ ...data, eligibility, eligibleEmployees: eligibility === 'EVERYONE' ? [] : employeeIds });
  try {
    await EventGoodie.create({ event: event._id, goodie: item._id, allocatedQuantity: item.totalQuantity });
  } catch (error) {
    await Goodie.findByIdAndDelete(item._id);
    throw error;
  }
  res.status(201).json(item);
} catch (e) { next(e); } });
router.patch('/:id', roles('ADMIN'), async (req, res, next) => { try {
  const item = await Goodie.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Goodie not found' });
  const { event: eventId, goodieName = item.goodieName, description = item.description, category = item.category, totalQuantity = item.totalQuantity, eligibility = item.eligibility, eligibleEmployees = item.eligibleEmployees } = req.body;
  if (!['EVERYONE', 'SELECTED'].includes(eligibility)) return res.status(400).json({ message: 'Choose a valid eligibility option' });
  const employeeIds = [...new Set(eligibleEmployees.map((id) => id.toString()))];
  if (eligibility === 'SELECTED' && !employeeIds.length) return res.status(400).json({ message: 'Select at least one eligible employee' });
  const validEmployees = await User.find({ _id: { $in: employeeIds }, role: 'EMPLOYEE', isActive: true }).select('_id');
  if (validEmployees.length !== employeeIds.length) return res.status(400).json({ message: 'One or more selected employees are unavailable' });
  const allocation = await EventGoodie.findOne({ goodie: item._id });
  if (allocation && Number(totalQuantity) < allocation.distributedQuantity) return res.status(400).json({ message: 'Quantity cannot be lower than the amount already distributed' });
  if (eventId && allocation && allocation.event.toString() !== eventId) {
    if (allocation.distributedQuantity > 0) return res.status(400).json({ message: 'The event cannot be changed after this goodie has been distributed' });
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.refreshStatus();
    if (!['UPCOMING', 'ONGOING'].includes(event.status)) return res.status(400).json({ message: 'Goodies can only be posted for upcoming or ongoing events' });
    if (await EventGoodie.exists({ event: event._id, goodie: item._id })) return res.status(409).json({ message: 'This goodie is already allocated to that event' });
    allocation.event = event._id;
  }
  Object.assign(item, { goodieName, description, category, totalQuantity, eligibility, eligibleEmployees: eligibility === 'EVERYONE' ? [] : employeeIds });
  await item.save();
  if (allocation) {
    allocation.allocatedQuantity = Number(totalQuantity);
    await allocation.save();
  }
  await AuditLog.create({ user: req.user._id, action: 'UPDATE', entityType: 'GOODIE', entityId: item._id, description: `Updated ${item.goodieName}` });
  res.json(item);
} catch (e) { next(e); } });
router.delete('/:id', roles('ADMIN'), async (req, res, next) => { try {
  const item = await Goodie.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: 'Goodie not found' });
  await Promise.all([EventGoodie.deleteMany({ goodie: item._id }), Distribution.deleteMany({ goodie: item._id })]);
  await AuditLog.create({ user: req.user._id, action: 'DELETE', entityType: 'GOODIE', entityId: item._id, description: `Deleted ${item.goodieName}` });
  res.status(204).end();
} catch (e) { next(e); } });
router.post('/allocate', roles('ADMIN', 'COORDINATOR'), async (req, res, next) => { try { const { event, goodie, allocatedQuantity } = req.body; const item = await Goodie.findById(goodie); if (!item || allocatedQuantity > item.totalQuantity) return res.status(400).json({ message: 'Allocated quantity exceeds inventory' }); res.status(201).json(await EventGoodie.create({ event, goodie, allocatedQuantity })); } catch (e) { next(e); } });
router.get('/distributions', async (req, res, next) => { try { const filter = req.user.role === 'EMPLOYEE' ? { employee: req.user._id } : {}; res.json(await Distribution.find(filter).populate('event goodie employee distributedBy', 'eventName goodieName name employeeId').sort({ createdAt: -1 })); } catch (e) { next(e); } });
router.post('/distributions', roles('ADMIN', 'COORDINATOR'), async (req, res, next) => { try { const { event, goodie, employee, quantity = 1 } = req.body; const item = await Goodie.findById(goodie); if (!item) return res.status(404).json({ message: 'Goodie not found' }); if (item.eligibility === 'SELECTED' && !item.eligibleEmployees.some((id) => id.toString() === employee)) return res.status(400).json({ message: 'Employee is not eligible for this goodie' }); if (!await Participant.exists({ event, employee, registrationStatus: { $ne: 'CANCELLED' } })) return res.status(400).json({ message: 'Employee is not registered for this event' }); const amount = Number(quantity); if (!Number.isInteger(amount) || amount < 1) return res.status(400).json({ message: 'Quantity must be a positive whole number' }); const allocation = await EventGoodie.findOne({ event, goodie }); if (!allocation || allocation.distributedQuantity + amount > allocation.allocatedQuantity) return res.status(400).json({ message: 'Distribution exceeds allocated quantity' }); const existing = await Distribution.exists({ event, goodie, employee }); if (existing) return res.status(409).json({ message: 'Goodie was already assigned to this employee' }); const distribution = await Distribution.create({ event, goodie, employee, quantity: amount, status: 'DISTRIBUTED', distributedAt: new Date(), distributedBy: req.user._id }); allocation.distributedQuantity += amount; await allocation.save(); await AuditLog.create({ user: req.user._id, action: 'DISTRIBUTE', entityType: 'GOODIE', entityId: goodie, description: 'Marked a goodie as distributed' }); res.status(201).json(distribution); } catch (e) { next(e); } });
export default router;
