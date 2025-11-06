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

console.error('Starting connection test...');
console.error('Config:', JSON.stringify(config, null, 2));

const startTime = Date.now();

try {
  console.error('Calling sql.connect()...');
  const pool = await sql.connect(config);
  const elapsed = Date.now() - startTime;
  console.error(`SUCCESS: Connected in ${elapsed}ms`);

  const result = await pool.request().query('SELECT @@VERSION AS Version');
  console.error('Query result:', result.recordset);

  await pool.close();
  process.exit(0);
} catch (error) {
  const elapsed = Date.now() - startTime;
  console.error(`FAILED after ${elapsed}ms`);
  console.error('Error:', error);
  process.exit(1);
}
