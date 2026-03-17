const router = require('express').Router();
const Payout = require('../models/Payout');
const Vendor = require('../models/Vendor');
const PayoutAudit = require('../models/PayoutAudit');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

const audit = (payout_id, action, performed_by) =>
  PayoutAudit.create({ payout_id, action, performed_by });

const VALID_STATUSES = ['Draft', 'Submitted', 'Approved', 'Rejected'];

// GET /payouts?status=&vendor_id=
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};
    if (req.query.status) {
      if (!VALID_STATUSES.includes(req.query.status))
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      where.status = req.query.status;
    }
    if (req.query.vendor_id) {
      const vid = parseInt(req.query.vendor_id);
      if (isNaN(vid)) return res.status(400).json({ error: 'vendor_id must be a number' });
      where.vendor_id = vid;
    }
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
router.post('/', authenticate, authorize('OPS'), async (req, res) => {
  try {
    const { vendor_id, amount, mode, note } = req.body;
    if (!vendor_id || !amount || !mode)
      return res.status(400).json({ error: 'vendor_id, amount, mode are required' });
    const vid = parseInt(vendor_id);
    if (isNaN(vid) || vid <= 0)
      return res.status(400).json({ error: 'vendor_id must be a positive integer' });
    if (Number(amount) <= 0)
      return res.status(400).json({ error: 'amount must be > 0' });
    if (!['UPI', 'IMPS', 'NEFT'].includes(mode))
      return res.status(400).json({ error: 'mode must be UPI, IMPS or NEFT' });

    const vendor = await Vendor.findByPk(vid);
    if (!vendor) return res.status(400).json({ error: 'Vendor not found' });

    const payout = await Payout.create({ vendor_id: vid, amount, mode, note: note || null, status: 'Draft' });
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
router.post('/:id/reject', authenticate, authorize('FINANCE'), async (req, res) => {
  try {
    const { decision_reason } = req.body;
    if (!decision_reason || !decision_reason.trim())
      return res.status(400).json({ error: 'decision_reason is required for rejection' });

    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(404).json({ error: 'Payout not found' });
    const payout = await Payout.findByPk(id);
    if (!payout) return res.status(404).json({ error: 'Payout not found' });
    if (payout.status !== 'Submitted')
      return res.status(400).json({ error: 'Only Submitted payouts can be rejected' });

    await payout.update({ status: 'Rejected', decision_reason: decision_reason.trim() });
    await audit(payout.id, 'REJECTED', req.user.id);
    res.json(payout);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
