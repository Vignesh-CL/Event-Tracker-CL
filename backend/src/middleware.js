import jwt from 'jsonwebtoken';
import { User } from './models.js';

export const auth = async (req, res, next) => { try { const token = req.headers.authorization?.split(' ')[1]; if (!token) return res.status(401).json({ message: 'Authentication required' }); req.user = await User.findById(jwt.verify(token, process.env.JWT_SECRET).id).select('-passwordHash'); if (!req.user?.isActive) return res.status(401).json({ message: 'Account unavailable' }); next(); } catch { res.status(401).json({ message: 'Invalid or expired token' }); } };
export const roles = (...allowed) => (req, res, next) => allowed.includes(req.user.role) ? next() : res.status(403).json({ message: 'You do not have permission for this action' });
export const audit = (action, entityType, description) => async (req) => { const { AuditLog } = await import('./models.js'); await AuditLog.create({ user: req.user._id, action, entityType, entityId: req.params.id || req.body.id, description }); };
