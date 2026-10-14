import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const Page = lazy(() => import("@/app/views/Movies"));

export const Route = createFileRoute("/movies")({
  head: () => ({
    meta: [
      { title: "Movies | VJ ONEFLEX.COM" },
      { name: "description", content: "Browse and download Luo translated movies by VJ ONEFLEX." },
      { property: "og:title", content: "Movies | VJ ONEFLEX.COM" },
      { property: "og:description", content: "Browse and download Luo translated movies by VJ ONEFLEX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MoviesPage,
});

function MoviesPage() {
  return <Page />;
}
