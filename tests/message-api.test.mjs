import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createHandler } from "../supabase/functions/submit-message/handler.js";

const origin = "https://tanghao205.github.io";
const env = {
  ALLOWED_ORIGINS: origin,
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "test-server-only",
  TURNSTILE_SECRET_KEY: "test-secret",
  RATE_LIMIT_SECRET: "test-hmac-secret",
};
const valid = {
  kind: "contact",
  name: "Visitor",
  email: "visitor@example.com",
  message: "I would like to discuss your portfolio.",
  token: "test-token",
};
const request = (body = valid, options = {}) =>
  new Request(`${env.SUPABASE_URL}/functions/v1/submit-message`, {
    method: "POST",
    headers: {
      origin,
      "Content-Type": "application/json",
      "x-forwarded-for": "192.0.2.1",
      ...options.headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("PostgreSQL migration protects messages and the handler writes only verified submissions", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role;",
    );
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202611090001_visitor_messages.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      for (const sql of [
        "select * from public.visitor_messages",
        "insert into public.visitor_messages(kind,name,message) values ('feedback','intruder','An unauthorized message')",
        "select public.submit_visitor_message(repeat('a',64),'feedback','intruder','','An unauthorized message')",
      ]) {
        await assert.rejects(db.query(sql), /permission denied/);
      }
      await db.exec("reset role");
    }
    const calls = [];
    const fetcher = async (url, options) => {
      calls.push(url);
      if (url.includes("siteverify"))
        return Response.json({
          success: true,
          hostname: "tanghao205.github.io",
          action: "portfolio-message",
        });
      if (url.includes("record_network_details")) return Response.json(null);
      assert.equal(options.headers.apikey, env.SUPABASE_SERVICE_ROLE_KEY);
      const p = JSON.parse(options.body);
      assert.match(p.p_rate_key, /^[a-f0-9]{64}$/);
      assert(!options.body.includes("192.0.2.1"));
      await db.exec("set role service_role");
      try {
        const result = await db.query(
          "select public.submit_visitor_message($1,$2,$3,$4,$5) as id",
          [p.p_rate_key, p.p_kind, p.p_name, p.p_email, p.p_message],
        );
        return Response.json(result.rows[0].id);
      } finally {
        await db.exec("reset role");
      }
    };
    const handler = createHandler(env, fetcher);
    assert.equal(
      (await handler(request({ ...valid, status: "archived" }))).status,
      201,
    );
    const saved = (await db.query("select * from public.visitor_messages")).rows[0];
    assert.equal(saved.status, "new");
    assert.equal(saved.message, valid.message);
    assert.equal((await handler(request())).status, 201);
    assert.equal((await handler(request())).status, 201);
    assert.equal((await handler(request())).status, 429);
    assert.equal(
      (await db.query("select count(*) from public.visitor_messages")).rows[0].count,
      3,
    );
    const before = calls.length;
    for (const input of [
      { ...valid, message: "short" },
      { ...valid, email: "bad" },
      { ...valid, email: "" },
      { ...valid, token: "" },
      { ...valid, website: "spam" },
      { ...valid, kind: "publish" },
      "null",
      "{bad",
      "x".repeat(24001),
    ]) {
      assert((await handler(request(input))).status >= 400);
    }
    assert.equal(calls.length, before);
    assert.equal(
      (await handler(request(valid, { headers: { origin: "https://other.example" } })))
        .status,
      403,
    );
    const preflight = await handler(
      new Request(request().url, { method: "OPTIONS", headers: { origin } }),
    );
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), origin);
    await db.query(
      "update public.message_rate_buckets set count = 50 where key = 'global'",
    );
    assert.equal(
      (await handler(request({ ...valid, email: "another@example.com" }))).status,
      429,
    );
    assert.equal(
      (await db.query("select count(*) from public.visitor_messages")).rows[0].count,
      3,
    );
  } finally {
    await db.close();
  }
});

test("verification, storage outages, and optional notification failures have honest results", async () => {
  for (const verification of [
    { success: false },
    { success: true, hostname: "wrong.example", action: "portfolio-message" },
    { success: true, hostname: "tanghao205.github.io", action: "wrong" },
  ]) {
    let calls = 0;
    const handler = createHandler(env, async () => {
      calls++;
      return Response.json(verification);
    });
    assert.equal((await handler(request())).status, 400);
    assert.equal(calls, 1);
  }
  const verified = {
    success: true,
    hostname: "tanghao205.github.io",
    action: "portfolio-message",
  };
  const outage = createHandler(env, async (url) =>
    url.includes("siteverify")
      ? Response.json(verified)
      : new Response("private database error", { status: 500 }),
  );
  const failed = await outage(request());
  assert.equal(failed.status, 503);
  assert(!(await failed.text()).includes("private database error"));
  assert.equal(
    (await createHandler({ ALLOWED_ORIGINS: origin })(request())).status,
    503,
  );
  const notified = createHandler(
    {
      ...env,
      RESEND_API_KEY: "test",
      NOTIFICATION_FROM: "test@example.com",
      NOTIFICATION_TO: "owner@example.com",
      IMMEDIATE_NOTIFICATIONS: "true",
    },
    async (url) => {
      if (url.includes("siteverify")) return Response.json(verified);
      if (url.includes("/rpc/"))
        return Response.json("f0000000-0000-0000-0000-000000000000");
      throw new Error("email service unavailable");
    },
  );
  assert.equal((await notified(request())).status, 201);
});
