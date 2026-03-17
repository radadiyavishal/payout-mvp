const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Vendor = require('./Vendor');

const Payout = sequelize.define('Payout', {
  vendor_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'vendors', key: 'id' } },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  mode: { type: DataTypes.ENUM('UPI', 'IMPS', 'NEFT'), allowNull: false },
  note: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected'), defaultValue: 'Draft' },
  decision_reason: { type: DataTypes.TEXT },
}, { tableName: 'payouts' });

Payout.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

module.exports = Payout;
