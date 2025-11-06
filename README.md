# MSSQL MCP Server

Model Context Protocol (MCP) server for Microsoft SQL Server with SQL authentication.

## Features

- **Full SQL Support**: Execute SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, and more
- **Automatic .env Loading**: Loads database credentials from your project's `.env` file
- **Cross-Database Queries**: Query multiple databases on the same server
- **Schema Exploration**: List tables and describe table structures
- **Connection Pooling**: Efficient connection management

## Installation

Install directly from GitHub:

```bash
npm install github:ddonathan/mssql-mcp-server
```

Or with pnpm:

```bash
pnpm add github:ddonathan/mssql-mcp-server
```

## Configuration

### 1. Add to your `.env` file:

```env
DB_SERVER=your-server.com
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_PORT=1433
DB_TRUST_CERT=true
```

### 2. Configure in `.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "mssql": {
      "command": "node",
      "args": [
        "./node_modules/mssql-mcp-server/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

The server automatically loads credentials from your project's `.env` file based on the current working directory.

## Available Tools

### `mcp__mssql__query`

Execute any SQL statement and return results or status.

**Examples:**

```sql
-- SELECT query (returns data)
SELECT * FROM users WHERE status = 'active'

-- CREATE VIEW (returns success message)
CREATE VIEW migration.MyView AS
SELECT id, name FROM users

-- INSERT (returns rows affected)
INSERT INTO users (name, email) VALUES ('John', 'john@example.com')

-- Cross-database query
SELECT * FROM other_database.dbo.table1
```

### `mcp__mssql__list_tables`

List all tables and views in the database.

### `mcp__mssql__describe_table`

Get the schema (columns, types, constraints) of a specific table.

## Response Formats

**SELECT queries:**
```json
[
  {"id": 1, "name": "John"},
  {"id": 2, "name": "Jane"}
]
```

**DDL/DML operations:**
```json
{
  "success": true,
  "rowsAffected": [1],
  "message": "Query executed successfully. Rows affected: 1"
}
```

## Version History

### v1.1.0
- Added support for DDL operations (CREATE, ALTER, DROP)
- Added support for DML operations (INSERT, UPDATE, DELETE)
- Automatic .env loading from project directory
- Added dotenv dependency

### v1.0.0
- Initial release with SELECT query support
- Table listing and description
- Connection pooling

## License

ISC
