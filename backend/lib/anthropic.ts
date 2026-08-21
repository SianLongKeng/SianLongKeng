import Anthropic from "@anthropic-ai/sdk";

// Single client reused across warm serverless invocations, mirroring the
// lazy-init pattern used for the Postgres pool in lib/db.ts.
declare global {
  // eslint-disable-next-line no-var
  var _anthropicClient: Anthropic | undefined;
}

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!global._anthropicClient) {
    global._anthropicClient = new Anthropic();
  }
  return global._anthropicClient;
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
