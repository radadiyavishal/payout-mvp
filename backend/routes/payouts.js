const router = require('express').Router();
const Payout = require('../models/Payout');
const Vendor = require('../models/Vendor');
const PayoutAudit = require('../models/PayoutAudit');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPayoutSchema, payoutQuerySchema, rejectSchema } = require('../validators/schemas');

const audit = (payout_id, action, performed_by) =>
  PayoutAudit.create({ payout_id, action, performed_by });

// GET /payouts?status=&vendor_id=
router.get('/', authenticate, validate(payoutQuerySchema, 'query'), async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.vendor_id) where.vendor_id = req.query.vendor_id;

    const payouts = await Payout.findAll({
      where,
      include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(payouts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /payouts — OPS only
router.post('/', authenticate, authorize('OPS'), validate(createPayoutSchema), async (req, res) => {
  try {
    const { vendor_id, amount, mode, note } = req.body;
    const vendor = await Vendor.findByPk(vendor_id);
    if (!vendor) return res.status(400).json({ error: 'Vendor not found' });

    const payout = await Payout.create({ vendor_id, amount, mode, note: note || null, status: 'Draft' });
    await audit(payout.id, 'CREATED', req.user.id);
    res.status(201).json(payout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /payouts/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ error: 'Payout not found' });
    const payout = await Payout.findByPk(id, {
      include: [{ model: Vendor, as: 'vendor' }],
    });
    if (!payout) return res.status(404).json({ error: 'Payout not found' });

    const audits = await PayoutAudit.findAll({
      where: { payout_id: payout.id },
      include: [{ model: User, as: 'user', attributes: ['email', 'role'] }],
      order: [['createdAt', 'ASC']],
    });
    res.json({ ...payout.toJSON(), audits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /payouts/:id/submit — OPS only, Draft → Submitted
router.post('/:id/submit', authenticate, authorize('OPS'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ error: 'Payout not found' });
    const payout = await Payout.findByPk(id);
    if (!payout) return res.status(404).json({ error: 'Payout not found' });
    if (payout.status !== 'Draft')
      return res.status(400).json({ error: 'Only Draft payouts can be submitted' });

    await payout.update({ status: 'Submitted' });
    await audit(payout.id, 'SUBMITTED', req.user.id);
    res.json(payout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /payouts/:id/approve — FINANCE only, Submitted → Approved
router.post('/:id/approve', authenticate, authorize('FINANCE'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ error: 'Payout not found' });
    const payout = await Payout.findByPk(id);
    if (!payout) return res.status(404).json({ error: 'Payout not found' });
    if (payout.status !== 'Submitted')
      return res.status(400).json({ error: 'Only Submitted payouts can be approved' });

    await payout.update({ status: 'Approved' });
    await audit(payout.id, 'APPROVED', req.user.id);
    res.json(payout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /payouts/:id/reject — FINANCE only, Submitted → Rejected
router.post('/:id/reject', authenticate, authorize('FINANCE'), validate(rejectSchema), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ error: 'Payout not found' });
    const payout = await Payout.findByPk(id);
    if (!payout) return res.status(404).json({ error: 'Payout not found' });
    if (payout.status !== 'Submitted')
      return res.status(400).json({ error: 'Only Submitted payouts can be rejected' });

    await payout.update({ status: 'Rejected', decision_reason: req.body.decision_reason });
    await audit(payout.id, 'REJECTED', req.user.id);
    res.json(payout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
