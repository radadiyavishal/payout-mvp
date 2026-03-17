const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Vendor = sequelize.define('Vendor', {
  name: { type: DataTypes.STRING, allowNull: false },
  upi_id: { type: DataTypes.STRING },
  bank_account: { type: DataTypes.STRING },
  ifsc: { type: DataTypes.STRING },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'vendors' });

module.exports = Vendor;
