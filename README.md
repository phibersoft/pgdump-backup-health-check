# PGDump Backup Health Check

`pg_dump` (or PgAdmin's backup tool) has a bug that sometimes causes backup files to miss tables or data. I noticed this when my backup files were way too large and found out about the issue. For critical projects, this can be a big problem, so I made this simple script to check backup health.

> This is likely related to the recent encoding issues that have been frequently reported.

## Features
- Verifies if all tables have a `CREATE TABLE` statement in the backup file.
- Checks for `INSERT INTO` statements for each table.
- If a table is missing `INSERT INTO` statements, it queries the database to determine if the table has rows.
- Logs issues with table health in a detailed and readable manner.

## Requirements
- Node.js (with Bun runtime)
- PostgreSQL database

## Setup
### 1. Install Dependencies
```bash
bun install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory with the following format:

```env
DB_USER=your_database_user
DB_HOST=your_database_host
DB_NAME=your_database_name
DB_PASSWORD=your_database_password
DB_PORT=5432
```

### 3. Run the Script
Specify the path to your backup file in the script or pass it as an argument.

```bash
bun run index.ts
```

## Output
- Tables that pass all checks will be logged as healthy.
- Tables missing critical data or structures will be flagged with detailed messages.
- At the end, a summary of failed tables (if any) will be displayed.

## Example Usage
```bash
bun run index.ts
```
- If there are no issues, you’ll see:
```text
Backup health check completed successfully. All tables are healthy.
```
- If there are errors, you’ll see a summary like this:
```text
Failed tables: schema1.table1, schema2.table2
```

