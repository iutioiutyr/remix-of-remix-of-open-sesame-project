import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const Page = lazy(() => import("@/app/views/Home"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUO NIGER MOVIES | Luo Movies, Series & Music" },
      { name: "description", content: "Uganda's #1 source for Luo translated movies, series and animations. Download HD MP4 movies with Luo subtitles by LUO NIGER MOVIES." },
      { property: "og:title", content: "LUO NIGER MOVIES | Luo Movies, Series & Music" },
      { property: "og:description", content: "Uganda's #1 source for Luo translated movies, series and animations. Download HD MP4 movies with Luo subtitles by LUO NIGER MOVIES." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return <Page />;
}
