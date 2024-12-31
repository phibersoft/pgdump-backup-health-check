import { readFileSync } from "fs";
import { config } from "dotenv";
import { Client, type ClientConfig } from "pg";
import chalk from "chalk";

// Load environment variables from .env file
config();

// Database connection configuration
const dbConfig: ClientConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),

  // Disable SSL for local development
  ssl: {
    rejectUnauthorized: false,
  },
};

// Function to fetch all table names from the database
async function getTableNames(): Promise<string[]> {
  const client = new Client(dbConfig);
  await client.connect();

  try {
    const res = await client.query(
      "SELECT table_schema || '.' || table_name AS full_table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('information_schema', 'pg_catalog');",
    );
    return res.rows.map((row) => row.full_table_name);
  } finally {
    await client.end();
  }
}

// Function to check the health of the backup file
async function checkBackupHealth(backupFilePath: string): Promise<void> {
  const backupContent = readFileSync(backupFilePath, "utf8");
  const tableNames = await getTableNames();
  const failedTables: string[] = [];

  console.log(chalk.blue("Starting backup health check...\n"));

  for (const tableName of tableNames) {
    console.log(chalk.yellow(`\nChecking table: ${tableName}`));

    const createTableRegex = new RegExp(
      `CREATE TABLE ${tableName.replace(".", "\\.")}`,
      "i",
    );
    const insertIntoRegex = new RegExp(
      `INSERT INTO ${tableName.replace(".", "\\.")}`,
      "i",
    );

    // Check if CREATE TABLE statement exists
    if (!createTableRegex.test(backupContent)) {
      console.warn(
        chalk.red(
          `CREATE TABLE statement for ${tableName} is missing in the backup.`,
        ),
      );
      failedTables.push(tableName);
      continue;
    }

    // Check if INSERT INTO statement exists
    if (!insertIntoRegex.test(backupContent)) {
      console.log(
        chalk.cyan(
          `No INSERT INTO statements found for ${tableName}. Checking row count in the database...`,
        ),
      );
      const client = new Client(dbConfig);
      await client.connect();

      try {
        const res = await client.query(`SELECT COUNT(*) AS row_count
                                                FROM ${tableName}`);
        const rowCount = parseInt(res.rows[0].row_count, 10);

        if (rowCount > 0) {
          console.error(
            chalk.red(
              `Error: Table ${tableName} has ${rowCount} rows in the database but no INSERT INTO statements in the backup.`,
            ),
          );
          failedTables.push(tableName);
        } else {
          console.log(
            chalk.green(
              `Table ${tableName} is healthy (no rows in the database).`,
            ),
          );
        }
      } finally {
        await client.end();
      }
    } else {
      console.log(chalk.green(`Table ${tableName} is healthy.`));
    }
  }

  if (failedTables.length > 0) {
    console.log(chalk.red("\nBackup health check completed with errors."));
    console.log(chalk.red(`Failed tables: ${failedTables.join(", ")}`));
  } else {
    console.log(
      chalk.green(
        "\nBackup health check completed successfully. All tables are healthy.",
      ),
    );
  }
}

// Run the script
const backupFilePath =
  "D:\\Administrator's Files\\Back Docs\\Backups\\gumusistan-30-12-2024.sql";
checkBackupHealth(backupFilePath).catch((err) => {
  console.error(chalk.red("An error occurred:"), err);
});
