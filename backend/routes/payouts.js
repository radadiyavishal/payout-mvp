const router = require('express').Router();
const { Op } = require('sequelize');
const Payout = require('../models/Payout');
const Vendor = require('../models/Vendor');
const PayoutAudit = require('../models/PayoutAudit');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const audit = (payout_id, action, performed_by) =>
  PayoutAudit.create({ payout_id, action, performed_by });

// GET /payouts?status=&vendor_id=
router.get('/', authenticate, async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.vendor_id) where.vendor_id = req.query.vendor_id;
  const payouts = await Payout.findAll({
    where,
    include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(payouts);
});

// POST /payouts — OPS only
router.post('/', authenticate, authorize('OPS'), async (req, res) => {
  const { vendor_id, amount, mode, note } = req.body;
  if (!vendor_id || !amount || !mode) return res.status(400).json({ error: 'vendor_id, amount, mode are required' });
  if (Number(amount) <= 0) return res.status(400).json({ error: 'amount must be > 0' });
  if (!['UPI', 'IMPS', 'NEFT'].includes(mode)) return res.status(400).json({ error: 'Invalid mode' });

  const payout = await Payout.create({ vendor_id, amount, mode, note, status: 'Draft' });
  await audit(payout.id, 'CREATED', req.user.id);
  res.status(201).json(payout);
});

// GET /payouts/:id
router.get('/:id', authenticate, async (req, res) => {
  const payout = await Payout.findByPk(req.params.id, {
    include: [{ model: Vendor, as: 'vendor' }],
  });
  if (!payout) return res.status(404).json({ error: 'Not found' });

  const audits = await PayoutAudit.findAll({
    where: { payout_id: payout.id },
    include: [{ model: User, as: 'user', attributes: ['email', 'role'] }],
    order: [['createdAt', 'ASC']],
  });
  res.json({ ...payout.toJSON(), audits });
});

// POST /payouts/:id/submit — OPS only, Draft → Submitted
router.post('/:id/submit', authenticate, authorize('OPS'), async (req, res) => {
  const payout = await Payout.findByPk(req.params.id);
  if (!payout) return res.status(404).json({ error: 'Not found' });
  if (payout.status !== 'Draft') return res.status(400).json({ error: 'Only Draft payouts can be submitted' });

  await payout.update({ status: 'Submitted' });
  await audit(payout.id, 'SUBMITTED', req.user.id);
  res.json(payout);
});

// POST /payouts/:id/approve — FINANCE only, Submitted → Approved
router.post('/:id/approve', authenticate, authorize('FINANCE'), async (req, res) => {
  const payout = await Payout.findByPk(req.params.id);
  if (!payout) return res.status(404).json({ error: 'Not found' });
  if (payout.status !== 'Submitted') return res.status(400).json({ error: 'Only Submitted payouts can be approved' });

  await payout.update({ status: 'Approved' });
  await audit(payout.id, 'APPROVED', req.user.id);
  res.json(payout);
});

// POST /payouts/:id/reject — FINANCE only, Submitted → Rejected
router.post('/:id/reject', authenticate, authorize('FINANCE'), async (req, res) => {
  const { decision_reason } = req.body;
  if (!decision_reason) return res.status(400).json({ error: 'decision_reason is required for rejection' });

  const payout = await Payout.findByPk(req.params.id);
  if (!payout) return res.status(404).json({ error: 'Not found' });
  if (payout.status !== 'Submitted') return res.status(400).json({ error: 'Only Submitted payouts can be rejected' });

  await payout.update({ status: 'Rejected', decision_reason });
  await audit(payout.id, 'REJECTED', req.user.id);
  res.json(payout);
});

module.exports = router;
