#!/usr/bin/env node

import sql from 'mssql';

const config = {
  server: '127.0.0.1',
  database: 'bellwether_portal_dev',
  user: 'sa',
  password: 'MyStrongPass123',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  connectionTimeout: 5000,
  requestTimeout: 5000,
};

console.log('Testing connection to:', config.server + ':' + config.port + '/' + config.database);
console.log('Config:', JSON.stringify(config, null, 2));

const startTime = Date.now();

try {
  const pool = await sql.connect(config);
  const elapsed = Date.now() - startTime;
  console.log(`✅ Connected successfully in ${elapsed}ms`);

  const result = await pool.request().query('SELECT @@VERSION AS Version, DB_NAME() AS CurrentDatabase');
  console.log('Query result:', result.recordset);

  await pool.close();
  console.log('Connection closed');
  process.exit(0);
} catch (error) {
  const elapsed = Date.now() - startTime;
  console.error(`❌ Connection failed after ${elapsed}ms:`, error.message);
  console.error('Full error:', error);
  process.exit(1);
}
