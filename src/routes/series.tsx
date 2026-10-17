import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/series")({
  beforeLoad: () => { throw redirect({ to: '/movies', replace: true }); },
  head: () => ({
    meta: [
      { title: "TV Series | LUO NIGER MOVIES" },
      { name: "description", content: "Browse and download Luo translated TV series by LUO NIGER MOVIES." },
      { property: "og:title", content: "TV Series | LUO NIGER MOVIES" },
      { property: "og:description", content: "Browse and download Luo translated TV series by LUO NIGER MOVIES." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
