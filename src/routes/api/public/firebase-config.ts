import { createFileRoute } from "@tanstack/react-router";

// Firebase web config values are public by design (shipped to every browser);
// they're kept as secrets only so they can be changed without code edits.
export const Route = createFileRoute("/api/public/firebase-config")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          {
            apiKey: (process.env.GOOGLE_API_KEY || "").trim(),
            measurementId: (process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID || "").trim(),
          },
          { headers: { "Cache-Control": "no-store" } },
        ),
    },
  },
});
