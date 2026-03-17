const router = require('express').Router();
const Vendor = require('../models/Vendor');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { vendorSchema } = require('../validators/schemas');

router.get('/', authenticate, async (req, res) => {
  try {
    const vendors = await Vendor.findAll({ order: [['createdAt', 'DESC']] });
    res.json(vendors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticate, validate(vendorSchema), async (req, res) => {
  try {
    const { name, upi_id, bank_account, ifsc, is_active } = req.body;
    const vendor = await Vendor.create({ name, upi_id, bank_account, ifsc, is_active });
    res.status(201).json(vendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
