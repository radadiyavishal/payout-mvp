require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./config/db');
const User = require('./models/User');
const Vendor = require('./models/Vendor');
require('./models/Payout');
require('./models/PayoutAudit');

async function seed() {
  await sequelize.sync({ force: true });

  const hash = (p) => bcrypt.hash(p, 10);

  await User.bulkCreate([
    { email: 'ops@demo.com', password: await hash('ops123'), role: 'OPS' },
    { email: 'finance@demo.com', password: await hash('fin123'), role: 'FINANCE' },
  ]);

  await Vendor.bulkCreate([
    { name: 'Acme Corp', upi_id: 'acme@upi', is_active: true },
    { name: 'Beta Supplies', bank_account: '9876543210', ifsc: 'HDFC0001234', is_active: true },
  ]);

  console.log('Seeded successfully');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
