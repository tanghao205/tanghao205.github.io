import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { root } from "../scripts/build.mjs";

test("content schema starts empty, links records, and keeps them private", async () => {
  const database = new DatabaseSync(":memory:");
  try {
    database.exec(await readFile(join(root, "data", "schema.sql"), "utf8"));
    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);
    assert.deepEqual(tables, ["company", "material", "task", "timing"]);
    assert.equal(
      database.prepare("SELECT count(*) AS count FROM material").get().count,
      0,
    );

    const company = database
      .prepare("INSERT INTO company (name) VALUES (?)")
      .run("Example Co.");
    const task = database
      .prepare("INSERT INTO task (company_id, title) VALUES (?, ?)")
      .run(company.lastInsertRowid, "Example task");
    database
      .prepare("INSERT INTO timing (task_id, label, minutes_spent) VALUES (?, ?, ?)")
      .run(task.lastInsertRowid, "Planning", 25);
    database
      .prepare("INSERT INTO material (task_id, title, kind) VALUES (?, ?, ?)")
      .run(task.lastInsertRowid, "Draft", "spec");

    assert.equal(
      database.prepare("SELECT visibility FROM material").get().visibility,
      "private",
    );
    assert.equal(
      database.prepare("SELECT minutes_spent FROM timing").get().minutes_spent,
      25,
    );
    assert.throws(
      () =>
        database
          .prepare("INSERT INTO task (company_id, title) VALUES (999, 'Orphan')")
          .run(),
      /FOREIGN KEY/,
    );
    assert.throws(
      () =>
        database
          .prepare(
            "INSERT INTO material (title, visibility) VALUES ('Draft', 'shared')",
          )
          .run(),
      /CHECK constraint/,
    );
  } finally {
    database.close();
  }
});
