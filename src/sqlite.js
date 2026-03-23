import fs from "node:fs/promises";
import initSqlJs from "sql.js";

let sqlJsPromise;

async function getSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({});
  }

  return sqlJsPromise;
}

export async function readStateKeys(dbPath, keys) {
  const SQL = await getSqlJs();
  const buffer = await fs.readFile(dbPath);
  const db = new SQL.Database(buffer);

  try {
    const result = {};

    for (const key of keys) {
      const query = db.exec("SELECT value FROM ItemTable WHERE key = ?;", [key]);
      if (query.length > 0 && query[0].values.length > 0) {
        result[key] = query[0].values[0][0];
      }
    }

    return result;
  } finally {
    db.close();
  }
}

export async function upsertStateKeys(dbPath, keyValues, createMissingDb) {
  const SQL = await getSqlJs();
  let db;

  try {
    const buffer = await fs.readFile(dbPath);
    db = new SQL.Database(buffer);
  } catch (error) {
    if (!createMissingDb) {
      throw error;
    }

    db = new SQL.Database();
    db.run("CREATE TABLE IF NOT EXISTS ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB);");
    db.run("CREATE TABLE IF NOT EXISTS cursorDiskKV (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB);");
  }

  try {
    db.run("BEGIN TRANSACTION;");
    const statement = db.prepare("INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?);");

    for (const [key, value] of Object.entries(keyValues)) {
      statement.run([key, value]);
    }

    statement.free();
    db.run("COMMIT;");
    const data = Buffer.from(db.export());
    await fs.writeFile(dbPath, data);
  } catch (error) {
    try {
      db.run("ROLLBACK;");
    } catch {
      // ignore rollback failures
    }

    throw error;
  } finally {
    db.close();
  }
}
