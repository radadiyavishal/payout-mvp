const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
});

const vendorSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  upi_id: Joi.string().trim().allow('', null).optional(),
  bank_account: Joi.string().trim().allow('', null).optional(),
  ifsc: Joi.string().trim().uppercase().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).allow('', null).optional()
    .messages({ 'string.pattern.base': 'ifsc must be a valid IFSC code (e.g. SBIN0001234)' }),
  is_active: Joi.boolean().default(true),
});

const createPayoutSchema = Joi.object({
  vendor_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().precision(2).required(),
  mode: Joi.string().valid('UPI', 'IMPS', 'NEFT').required(),
  note: Joi.string().trim().max(500).allow('', null).optional(),
});

const payoutQuerySchema = Joi.object({
  status: Joi.string().valid('Draft', 'Submitted', 'Approved', 'Rejected').optional(),
  vendor_id: Joi.number().integer().positive().optional(),
});

const rejectSchema = Joi.object({
  decision_reason: Joi.string().trim().min(1).required()
    .messages({ 'string.empty': 'decision_reason is required for rejection' }),
});

module.exports = { loginSchema, vendorSchema, createPayoutSchema, payoutQuerySchema, rejectSchema };
