const router = require('express').Router();
const Vendor = require('../models/Vendor');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  const vendors = await Vendor.findAll({ order: [['createdAt', 'DESC']] });
  res.json(vendors);
});

router.post('/', authenticate, async (req, res) => {
  const { name, upi_id, bank_account, ifsc, is_active } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const vendor = await Vendor.create({ name, upi_id, bank_account, ifsc, is_active });
  res.status(201).json(vendor);
});

module.exports = router;
