const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');

const PayoutAudit = sequelize.define('PayoutAudit', {
  payout_id: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.ENUM('CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED'), allowNull: false },
  performed_by: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'payout_audits', updatedAt: false });

PayoutAudit.belongsTo(User, { foreignKey: 'performed_by', as: 'user' });

module.exports = PayoutAudit;
