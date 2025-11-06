// Test MSSQL connection
import sql from "mssql";

const config = {
  server: "localhost",
  database: "bellwether_portal_dev",
  user: "sa",
  password: "MyStrongPass123",
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

console.log("Testing SQL connection with config:", {
  ...config,
  password: "***"
});

try {
  const pool = await sql.connect(config);
  console.log("✓ Connected successfully!");

  const result = await pool.request().query("SELECT @@VERSION as version");
  console.log("✓ Query successful:", result.recordset[0]);

  await pool.close();
  console.log("✓ Connection closed");
} catch (err) {
  console.error("✗ Connection failed:", err.message);
  console.error("Full error:", err);
  process.exit(1);
}
