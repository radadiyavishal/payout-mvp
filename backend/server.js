require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

// import models to register associations
require('./models/User');
require('./models/Vendor');
require('./models/Payout');
require('./models/PayoutAudit');
require('./seed.js');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', require('./routes/auth'));
app.use('/vendors', require('./routes/vendors'));
app.use('/payouts', require('./routes/payouts'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

sequelize.sync().then(() => { 
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => { console.error('DB connection failed:', err); process.exit(1); });
