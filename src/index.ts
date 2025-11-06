#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import sql from "mssql";
import { config as dotenvConfig } from "dotenv";
import { join } from "path";

// Load .env from current working directory (the project using this MCP server)
const envPath = join(process.cwd(), '.env');
dotenvConfig({ path: envPath });
console.error(`MSSQL MCP Server - Loading .env from: ${envPath}`);

// Database configuration from environment variables
const config: sql.config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "",
  user: process.env.DB_USERNAME || "",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT === "true" || true,
    enableArithAbort: true,
    instanceName: '',
    useUTC: false,
  },
  connectionTimeout: 15000, // 15 seconds (WSL can be slow)
  requestTimeout: 30000, // 30 seconds
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

console.error(`MSSQL MCP Server - Config: ${config.server}:${config.port}/${config.database}`);

let pool: sql.ConnectionPool | null = null;

async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    console.error("MSSQL MCP Server - Connecting to database...");
    try {
      pool = await sql.connect(config);
      console.error("MSSQL MCP Server - Connected successfully");
    } catch (error) {
      console.error("MSSQL MCP Server - Connection failed:", error);
      throw error;
    }
  }
  return pool;
}

// Define available tools
const tools: Tool[] = [
  {
    name: "query",
    description: "Execute any SQL statement (SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, etc.) and return results or status",
    inputSchema: {
      type: "object",
      properties: {
        sql: {
          type: "string",
          description: "The SQL statement to execute (supports SELECT for data retrieval, DDL for schema changes, and DML for data modifications)",
        },
      },
      required: ["sql"],
    },
  },
  {
    name: "list_tables",
    description: "List all tables in the database",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "describe_table",
    description: "Get the schema of a specific table",
    inputSchema: {
      type: "object",
      properties: {
        table: {
          type: "string",
          description: "The name of the table to describe",
        },
      },
      required: ["table"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "mssql-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const connection = await getConnection();

    switch (name) {
      case "query": {
        const { sql: query } = args as { sql: string };
        const result = await connection.request().query(query);

        // Check if this is a SELECT query (returns data)
        if (result.recordset && result.recordset.length > 0) {
          // SELECT query - return the data
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result.recordset, null, 2),
              },
            ],
          };
        } else if (result.recordset !== undefined) {
          // SELECT query with no results
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify([], null, 2),
              },
            ],
          };
        } else {
          // DDL/DML query (CREATE, ALTER, DROP, INSERT, UPDATE, DELETE)
          // Return success message with metadata
          const response = {
            success: true,
            rowsAffected: result.rowsAffected,
            message: `Query executed successfully. Rows affected: ${result.rowsAffected.join(', ')}`,
          };
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        }
      }

      case "list_tables": {
        const result = await connection.request().query(`
          SELECT
            TABLE_SCHEMA,
            TABLE_NAME,
            TABLE_TYPE
          FROM INFORMATION_SCHEMA.TABLES
          ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.recordset, null, 2),
            },
          ],
        };
      }

      case "describe_table": {
        const { table } = args as { table: string };
        const result = await connection.request().input("table", sql.NVarChar, table).query(`
          SELECT
            COLUMN_NAME,
            DATA_TYPE,
            CHARACTER_MAXIMUM_LENGTH,
            IS_NULLABLE,
            COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = @table
          ORDER BY ORDINAL_POSITION
        `);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result.recordset, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MSSQL MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
