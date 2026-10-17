import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const Page = lazy(() => import("@/app/views/Series"));

export const Route = createFileRoute("/series")({
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
  component: SeriesPage,
});

function SeriesPage() {
  return <Page />;
}
