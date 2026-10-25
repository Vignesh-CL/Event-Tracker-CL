import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true }, email: { type: String, required: true, unique: true },
  department: String, designation: String, passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'COORDINATOR', 'EMPLOYEE'], default: 'EMPLOYEE' }, isActive: { type: Boolean, default: true }
}, { timestamps: true });

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true }, description: String,
  eventType: { type: String, default: 'Employee Engagement' }, startDate: { type: Date, required: true }, endDate: { type: Date, required: true },
  location: String, organizer: String, maximumParticipants: { type: Number, min: 1, required: true },
  registrationStartDate: Date, registrationEndDate: Date,
  status: { type: String, enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'], default: 'UPCOMING' }, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

eventSchema.methods.refreshStatus = function () {
  if (this.status === 'CANCELLED') return this.status;
  const now = new Date();
  this.status = now < this.startDate ? 'UPCOMING' : now <= this.endDate ? 'ONGOING' : 'COMPLETED';
  return this.status;
};

const participantSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }, employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  registrationStatus: { type: String, enum: ['REGISTERED', 'CONFIRMED', 'CANCELLED', 'WAITLISTED'], default: 'REGISTERED' }, attendanceStatus: { type: String, enum: ['NOT_MARKED', 'PRESENT', 'ABSENT'], default: 'NOT_MARKED' }, remarks: String
}, { timestamps: true });
participantSchema.index({ event: 1, employee: 1 }, { unique: true });

const goodieSchema = new mongoose.Schema({
  goodieName: { type: String, required: true },
  description: String,
  category: { type: String, default: 'Other' },
  totalQuantity: { type: Number, min: 0, required: true },
  eligibility: { type: String, enum: ['EVERYONE', 'SELECTED'], default: 'EVERYONE' },
  eligibleEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });
const eventGoodieSchema = new mongoose.Schema({ event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }, goodie: { type: mongoose.Schema.Types.ObjectId, ref: 'Goodie', required: true }, allocatedQuantity: { type: Number, min: 1, required: true }, distributedQuantity: { type: Number, default: 0 } });
eventGoodieSchema.index({ event: 1, goodie: 1 }, { unique: true });
const distributionSchema = new mongoose.Schema({ event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' }, goodie: { type: mongoose.Schema.Types.ObjectId, ref: 'Goodie' }, employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, quantity: { type: Number, default: 1 }, status: { type: String, enum: ['PENDING', 'DISTRIBUTED'], default: 'PENDING' }, distributedAt: Date, distributedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, remarks: String });
distributionSchema.index({ event: 1, goodie: 1, employee: 1 }, { unique: true });
const auditSchema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, action: String, entityType: String, entityId: String, description: String }, { timestamps: true });
export const User = mongoose.model('User', userSchema); export const Event = mongoose.model('Event', eventSchema); export const Participant = mongoose.model('Participant', participantSchema); export const Goodie = mongoose.model('Goodie', goodieSchema); export const EventGoodie = mongoose.model('EventGoodie', eventGoodieSchema); export const Distribution = mongoose.model('Distribution', distributionSchema); export const AuditLog = mongoose.model('AuditLog', auditSchema);
