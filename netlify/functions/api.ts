import serverless from "serverless-http";
import { app } from "../../server";

// Wrap the existing Express application so every `/api/*` route can run as a
// single Netlify Function. The `/api/*` redirect in netlify.toml rewrites
// requests to `/.netlify/functions/api/...`; we normalise the path back to the
// original `/api/...` shape so the Express routes match regardless of whether
// Netlify forwards the rewritten or the original path.
const wrapped = serverless(app);

const FUNCTION_PREFIX = "/.netlify/functions/api";

export const handler = async (event: any, context: any) => {
  if (typeof event.path === "string" && event.path.startsWith(FUNCTION_PREFIX)) {
    const remainder = event.path.slice(FUNCTION_PREFIX.length);
    event.path = "/api" + remainder;
  }
  return wrapped(event, context);
};
