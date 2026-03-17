const router = require('express').Router();
const Vendor = require('../models/Vendor');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const vendors = await Vendor.findAll({ order: [['createdAt', 'DESC']] });
    res.json(vendors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, upi_id, bank_account, ifsc } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
    const is_active = req.body.is_active !== undefined ? Boolean(req.body.is_active) : true;
    const vendor = await Vendor.create({ name: name.trim(), upi_id, bank_account, ifsc, is_active });
    res.status(201).json(vendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
