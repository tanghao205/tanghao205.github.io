import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createVisitHandler } from "../supabase/functions/track-visit/handler.js";
import {
  createDigestHandler,
  previousWeek,
} from "../supabase/functions/weekly-digest/handler.js";
import {
  reportedIp,
  publicIp,
  enrichNetwork,
} from "../supabase/functions/_shared/network.js";

const origin = "https://tanghao205.github.io";
const env = {
  ALLOWED_ORIGINS: origin,
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "private",
  TURNSTILE_SECRET_KEY: "secret",
  RATE_LIMIT_SECRET: "rate",
  GEO_LOOKUP_ENABLED: "true",
  DIGEST_JOB_SECRET: "job",
  RESEND_API_KEY: "email",
  NOTIFICATION_FROM: "sender@example.com",
  NOTIFICATION_TO: "owner@example.com",
};
const visitRequest = () =>
  new Request("https://test/visit", {
    method: "POST",
    headers: {
      origin,
      "Content-Type": "application/json",
      "x-forwarded-for": "1.1.1.1",
    },
    body: JSON.stringify({
      session: "f0000000-0000-4000-8000-000000000000",
    }),
  });
const digestRequest = () =>
  new Request("https://test/digest", {
    method: "POST",
    headers: { authorization: "Bearer job" },
  });

test("private network records, visit deduplication, retention and digest snapshot/lease", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon;create role authenticated;create role service_role;",
    );
    for (const name of [
      "202611090001_visitor_messages.sql",
      "202611260001_network_and_digest.sql",
      "202611260003_configurable_retention.sql",
      "202611260004_unlimited_retention.sql",
    ])
      await db.exec(
        await readFile(
          new URL(`../supabase/migrations/${name}`, import.meta.url),
          "utf8",
        ),
      );
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      for (const sql of [
        "select * from public.visitor_visits",
        "select * from public.weekly_digest_runs",
        "select * from public.messaging_settings",
        "update public.messaging_settings set network_retention_days=3650",
        "select public.prune_visitor_network()",
        "select public.record_network_details('visit',gen_random_uuid(),'1.1.1.1',null)",
        "select public.record_visitor_visit(gen_random_uuid(),repeat('a',64))",
        "select public.prepare_weekly_digest(now()-interval '7 days',now())",
      ])
        await assert.rejects(db.query(sql), /permission denied/);
      await db.exec("reset role");
    }
    const first = await db.query(
      "select public.record_visitor_visit('f0000000-0000-4000-8000-000000000000',repeat('a',64)) as id",
    );
    const id = first.rows[0].id;
    assert(id);
    assert.equal(
      (
        await db.query(
          "select public.record_visitor_visit('f0000000-0000-4000-8000-000000000000',repeat('a',64)) as id",
        )
      ).rows[0].id,
      null,
    );
    await db.query("select public.record_network_details('visit',$1,'1.1.1.1',$2)", [
      id,
      JSON.stringify({ country: "Australia" }),
    ]);
    assert.equal(
      (await db.query("select reported_ip from public.visitor_visits")).rows[0]
        .reported_ip,
      "1.1.1.1",
    );
    await db.query(
      "update public.visitor_visits set network_recorded_at=now()-interval '31 days'",
    );
    await db.query("select public.prune_visitor_network()");
    assert.equal(
      (await db.query("select reported_ip from public.visitor_visits")).rows[0]
        .reported_ip,
      null,
    );
    await db.query(
      "update public.messaging_settings set network_retention_days=60,visit_retention_days=180",
    );
    await db.query(
      "update public.visitor_visits set reported_ip='1.1.1.1',network_recorded_at=now()-interval '31 days'",
    );
    await db.query(
      "insert into public.visitor_visits(created_at,session_id,visit_day,path,network_hash) values(now()-interval '100 days',gen_random_uuid(),current_date-100,'/',repeat('b',64))",
    );
    await db.query("select public.prune_visitor_network()");
    assert.equal(
      (
        await db.query("select reported_ip from public.visitor_visits where id=$1", [
          id,
        ])
      ).rows[0].reported_ip,
      "1.1.1.1",
    );
    assert.equal(
      (await db.query("select count(*) from public.visitor_visits")).rows[0].count,
      2,
    );
    await assert.rejects(
      db.query("update public.messaging_settings set network_retention_days=0"),
      /check constraint/,
    );
    await assert.rejects(
      db.query("update public.messaging_settings set visit_retention_days=3651"),
      /check constraint/,
    );
    await db.query(
      "update public.messaging_settings set network_retention_days=30,visit_retention_days=90",
    );
    await db.query("select public.prune_visitor_network()");
    assert.equal(
      (
        await db.query("select reported_ip from public.visitor_visits where id=$1", [
          id,
        ])
      ).rows[0].reported_ip,
      null,
    );
    assert.equal(
      (await db.query("select count(*) from public.visitor_visits")).rows[0].count,
      1,
    );
    await db.query(
      "insert into public.visitor_messages(created_at,kind,name,message) values(now()-interval '2 days','feedback','Reader','A meaningful feedback message')",
    );
    await db.query(
      "update public.messaging_settings set network_retention_days=null,visit_retention_days=null",
    );
    await db.query(
      "update public.visitor_visits set reported_ip='1.1.1.1',network_recorded_at=now()-interval '1000 days'",
    );
    await db.query(
      "insert into public.visitor_visits(created_at,session_id,visit_day,path,network_hash) values(now()-interval '1000 days',gen_random_uuid(),current_date-1000,'/',repeat('c',64))",
    );
    await db.query(
      "update public.visitor_messages set reported_ip='1.1.1.1',network_recorded_at=now()-interval '1000 days'",
    );
    await db.query("select public.prune_visitor_network()");
    assert.equal(
      (await db.query("select count(*) from public.visitor_visits")).rows[0].count,
      2,
    );
    assert.equal(
      (await db.query("select reported_ip from public.visitor_messages")).rows[0]
        .reported_ip,
      "1.1.1.1",
    );
    assert.equal(
      (
        await db.query("select reported_ip from public.visitor_visits where id=$1", [
          id,
        ])
      ).rows[0].reported_ip,
      "1.1.1.1",
    );
    await db.query(
      "update public.messaging_settings set network_retention_days=30,visit_retention_days=90",
    );
    await db.query("select public.prune_visitor_network()");
    assert.equal(
      (await db.query("select count(*) from public.visitor_visits")).rows[0].count,
      1,
    );
    assert.equal(
      (await db.query("select reported_ip from public.visitor_messages")).rows[0]
        .reported_ip,
      null,
    );
    const endTime = Date.now();
    const start = new Date(endTime - 7 * 86400000).toISOString(),
      end = new Date(endTime).toISOString();
    const prepare = () =>
      db.query("select public.prepare_weekly_digest($1,$2) as run", [start, end]);
    const run = (await prepare()).rows[0].run;
    assert.equal(run.status, "ready");
    assert.equal(run.snapshot.messages, 1);
    assert.equal(run.snapshot.visits, 1);
    assert.equal((await prepare()).rows[0].run.status, "busy");
    await db.query(
      "update public.weekly_digest_runs set lease_until=now()-interval '1 minute'",
    );
    await db.query(
      "update public.visitor_messages set message='A different feedback message'",
    );
    const retry = (await prepare()).rows[0].run;
    assert.deepEqual(retry.snapshot, run.snapshot);
    await db.query("select public.finish_weekly_digest($1,'provider-id')", [start]);
    assert.equal((await prepare()).rows[0].run.status, "sent");
    for (let i = 0; i < 20; i++) {
      const result = await db.query(
        "select public.record_visitor_visit(gen_random_uuid(),repeat('d',64)) as id",
      );
      assert(result.rows[0].id);
    }
    assert.equal(
      (
        await db.query(
          "select public.record_visitor_visit(gen_random_uuid(),repeat('d',64)) as id",
        )
      ).rows[0].id,
      null,
    );
    await db.query(
      "update public.message_rate_buckets set count=500 where key='visit:global'",
    );
    assert.equal(
      (
        await db.query(
          "select public.record_visitor_visit(gen_random_uuid(),repeat('e',64)) as id",
        )
      ).rows[0].id,
      null,
    );
  } finally {
    await db.close();
  }
});

test("automatic visits validate origin and session before storage; location failure does not lose visits", async () => {
  const calls = [];
  const handler = createVisitHandler(env, async (url, options) => {
    calls.push(url);
    if (url.includes("record_visitor_visit"))
      return Response.json("f0000000-0000-4000-8000-000000000000");
    if (url.includes("ipwho.is")) throw new Error("lookup unavailable");
    if (url.includes("record_network_details")) {
      assert.equal(JSON.parse(options.body).p_ip, "1.1.1.1");
      return Response.json(null);
    }
    throw new Error("unexpected call");
  });
  assert.equal((await handler(visitRequest())).status, 202);
  assert(calls[0].includes("record_visitor_visit"));
  assert(!calls.some((url) => url.includes("siteverify")));
  let writes = 0;
  const rejected = createVisitHandler(env, async () => {
    writes++;
    return Response.json({ success: false });
  });
  const badOrigin = new Request(visitRequest(), {
    headers: { origin: "https://other.example", "Content-Type": "application/json" },
  });
  assert.equal((await rejected(badOrigin)).status, 403);
  const badSession = new Request(visitRequest().url, {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ session: "invalid" }),
  });
  assert.equal((await rejected(badSession)).status, 400);
  assert.equal(writes, 0);
  assert.equal(
    reportedIp(
      new Request("https://test", {
        headers: { "x-forwarded-for": "forged, 1.1.1.1" },
      }),
    ),
    "1.1.1.1",
  );
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "192.0.2.1",
    "::1",
    "fc00::1",
    "2001:db8::1",
    "bad",
  ])
    assert.equal(publicIp(ip), false);
  const collected = [];
  await enrichNetwork(
    env,
    async (url, options) => {
      if (url.includes("ipwho.is"))
        return Response.json({
          success: true,
          city: "Test",
          region: "Region",
          country: "Country",
          connection: { isp: "ISP" },
        });
      collected.push(JSON.parse(options.body));
      return Response.json(null);
    },
    "visit",
    "f0000000-0000-4000-8000-000000000000",
    "1.1.1.1",
  );
  assert.equal(collected[0].p_location.city, "Test");
});

test("digest authorizes requests, uses previous UTC week, handles provider failure and records acceptance", async () => {
  assert.deepEqual(previousWeek(new Date("2026-11-26T18:00:00Z")), {
    start: "2026-11-16T00:00:00.000Z",
    end: "2026-11-23T00:00:00.000Z",
  });
  let calls = 0;
  const inactive = createDigestHandler(env, async () => {
    calls++;
    throw new Error();
  });
  assert.equal(
    (await inactive(new Request("https://test", { method: "POST" }))).status,
    401,
  );
  assert.equal(calls, 0);
  assert.equal(
    (await createDigestHandler({ ...env, RESEND_API_KEY: "" })(digestRequest())).status,
    503,
  );
  const snapshot = {
    start: "2026-11-16T00:00:00Z",
    end: "2026-11-23T00:00:00Z",
    messages: 1,
    contact: 1,
    feedback: 0,
    unread: 1,
    updated_existing: 0,
    visits: 2,
    networks: 1,
    locations: [],
    excerpts: [
      { name: "Reader\nInjected", kind: "contact", status: "new", excerpt: "Hello" },
    ],
  };
  for (const success of [true, false]) {
    let finished = false;
    const handler = createDigestHandler(
      env,
      async (url, options) => {
        if (url.includes("prepare_weekly_digest"))
          return Response.json({ status: "ready", snapshot });
        if (url.includes("resend.com")) {
          assert(options.headers["Idempotency-Key"].includes("2026-11-16"));
          const email = JSON.parse(options.body);
          assert(!email.text.includes("Reader\nInjected"));
          return success
            ? Response.json({ id: "email-id" })
            : new Response("private provider error", { status: 403 });
        }
        if (url.includes("finish_weekly_digest")) {
          finished = true;
          return new Response(null, { status: 204 });
        }
        throw new Error("unexpected");
      },
      () => new Date("2026-11-26T18:00:00Z"),
    );
    const response = await handler(digestRequest());
    assert.equal(response.status, success ? 200 : 502);
    assert.equal(finished, success);
  }
  const duplicate = createDigestHandler(env, async () =>
    Response.json({ status: "sent" }),
  );
  assert.equal((await duplicate(digestRequest())).status, 200);
});
