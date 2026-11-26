import { createVisitHandler } from "./handler.js";
Deno.serve(createVisitHandler(Deno.env.toObject()));
