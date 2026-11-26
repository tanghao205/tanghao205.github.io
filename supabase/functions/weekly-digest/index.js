import { createDigestHandler } from "./handler.js";
Deno.serve(createDigestHandler(Deno.env.toObject()));
