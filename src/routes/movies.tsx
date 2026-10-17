import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const Page = lazy(() => import("@/app/views/Movies"));

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "Movies | LUO NIGER MOVIES" },
      { name: "description", content: "Browse and download Nigerian movies by LUO NIGER MOVIES." },
      { property: "og:title", content: "Movies | LUO NIGER MOVIES" },
      { property: "og:description", content: "Browse and download Nigerian movies by LUO NIGER MOVIES." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MoviesPage,
});

function MoviesPage() {
  return <Page />;
}
