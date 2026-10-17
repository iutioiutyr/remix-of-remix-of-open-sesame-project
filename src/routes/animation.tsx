import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/animation")({
  beforeLoad: () => { throw redirect({ to: '/movies', replace: true }); },
  head: () => ({
    meta: [
      { title: "Animation | LUO NIGER MOVIES" },
      { name: "description", content: "Browse and download Luo translated animations by LUO NIGER MOVIES." },
      { property: "og:title", content: "Animation | LUO NIGER MOVIES" },
      { property: "og:description", content: "Browse and download Luo translated animations by LUO NIGER MOVIES." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
