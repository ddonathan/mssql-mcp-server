import sql from 'mssql';

// Enable debug mode
sql.on('error', err => {
  console.error('SQL error event:', err);
});

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
    instanceName: '',
    useUTC: false,
  },
  connectionTimeout: 10000,
  requestTimeout: 10000,
  driver: 'tedious',
};

console.error('Config:', JSON.stringify({...config, password: '***'}, null, 2));
console.error('Starting connection...');

setTimeout(() => {
  console.error('ERROR: Connection timeout after 12 seconds');
  process.exit(1);
}, 12000);

try {
  const pool = await sql.connect(config);
  console.error('SUCCESS: Connected!');
  const result = await pool.request().query('SELECT @@VERSION AS Version');
  console.error('Result:', result.recordset);
  await pool.close();
  process.exit(0);
} catch (error) {
  console.error('CATCH block - Connection error:', error.message);
  console.error('Error code:', error.code);
  console.error('Full error:', error);
  process.exit(1);
}
