import { DatabaseSync } from "node:sqlite";
import { access, mkdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { root } from "./build.mjs";

const databasePath = join(root, "private", "portfolio.sqlite");
const schemaPath = join(root, "data", "schema.sql");
const columns = {
  company: ["name", "summary", "website_url", "visibility"],
  task: ["company_id", "title", "summary", "status", "visibility"],
  timing: ["task_id", "label", "starts_at", "ends_at", "minutes_spent", "note"],
  material: [
    "company_id",
    "task_id",
    "title",
    "kind",
    "body",
    "source_url",
    "visibility",
  ],
};
const required = {
  company: "name",
  task: "title",
  timing: "label",
  material: "title",
};
const listColumns = {
  company: "id, name, visibility, created_at",
  task: "id, company_id, title, status, visibility, created_at",
  timing: "id, task_id, label, starts_at, ends_at, minutes_spent",
  material: "id, company_id, task_id, title, kind, visibility, created_at",
};

function usage() {
  return `Local content store (never included in the website build)

  npm run content -- init
  npm run content -- add company --name "Company name"
  npm run content -- add task --title "Task" --company-id 1
  npm run content -- add timing --label "Milestone" --task-id 1 --starts-at 2026-10-26
  npm run content -- add material --title "Notes" --kind spec --body-file "path/to/notes.txt"
  npm run content -- list company|task|timing|material
  npm run content -- get company|task|timing|material ID

Fields: company(name, summary, website-url, visibility);
task(company-id, title, summary, status, visibility);
timing(task-id, label, starts-at, ends-at, minutes-spent, note);
material(company-id, task-id, title, kind, body, body-file, source-url, visibility).
All visibility values default to private. Setting public is metadata only; nothing is published.
`;
}

function parseOptions(tokens) {
  const options = {};
  for (let index = 0; index < tokens.length; index += 2) {
    const key = tokens[index];
    const value = tokens[index + 1];
    if (
      !/^--[a-z][a-z-]*$/.test(key || "") ||
      value === undefined ||
      value.startsWith("--")
    )
      throw new Error(`Expected --field value; got ${key || "end of command"}.`);
    const column = key.slice(2).replaceAll("-", "_");
    if (column in options) throw new Error(`Repeated field: ${key}.`);
    options[column] = value;
  }
  return options;
}

async function main() {
  const [command, entity, ...rest] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help") {
    console.log(usage());
    return;
  }

  if (command === "init") {
    if (entity) throw new Error("init does not take an entity.");
    await mkdir(join(root, "private"), { recursive: true });
    const database = new DatabaseSync(databasePath);
    try {
      database.exec(await readFile(schemaPath, "utf8"));
    } finally {
      database.close();
    }
    console.log("Local content database is ready at private/portfolio.sqlite.");
    return;
  }

  if (!columns[entity])
    throw new Error("Choose company, task, timing, or material.\n" + usage());
  await access(databasePath).catch(() => {
    throw new Error("Run `npm run content -- init` first.");
  });
  const database = new DatabaseSync(databasePath);
  try {
    database.exec("PRAGMA foreign_keys = ON");
    if (command === "add") {
      const options = parseOptions(rest);
      if (entity === "material" && options.body_file) {
        if (options.body) throw new Error("Use either --body or --body-file.");
        const file = await stat(options.body_file);
        if (!file.isFile() || file.size > 2_000_000)
          throw new Error("--body-file must be a text file under 2 MB.");
        options.body = await readFile(options.body_file, "utf8");
        delete options.body_file;
      }
      for (const field of Object.keys(options))
        if (!columns[entity].includes(field))
          throw new Error(`Unknown ${entity} field: ${field}.`);
      if (!options[required[entity]])
        throw new Error(`${entity} needs --${required[entity].replaceAll("_", "-")}.`);
      for (const field of ["company_id", "task_id", "minutes_spent"])
        if (options[field] !== undefined && !/^\d+$/.test(options[field]))
          throw new Error(
            `--${field.replaceAll("_", "-")} must be a non-negative integer.`,
          );
      const fields = Object.keys(options);
      const sql = `INSERT INTO ${entity} (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`;
      const result = database
        .prepare(sql)
        .run(...fields.map((field) => options[field]));
      console.log(`Added ${entity} #${result.lastInsertRowid} to the local database.`);
      return;
    }
    if (command === "list") {
      if (rest.length) throw new Error("list takes only an entity.");
      console.log(
        JSON.stringify(
          database
            .prepare(
              `SELECT ${listColumns[entity]} FROM ${entity} ORDER BY id DESC LIMIT 50`,
            )
            .all(),
          null,
          2,
        ),
      );
      return;
    }
    if (command === "get") {
      if (rest.length !== 1 || !/^\d+$/.test(rest[0]))
        throw new Error("get needs one numeric ID.");
      const row = database
        .prepare(`SELECT * FROM ${entity} WHERE id = ?`)
        .get(Number(rest[0]));
      if (!row) throw new Error(`${entity} #${rest[0]} was not found.`);
      console.log(JSON.stringify(row, null, 2));
      return;
    }
    throw new Error(`Unknown command: ${command}.\n` + usage());
  } finally {
    database.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
