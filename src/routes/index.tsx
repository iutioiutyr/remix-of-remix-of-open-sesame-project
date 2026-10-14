import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const Page = lazy(() => import("@/app/views/Home"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUO NIGER | Download Luo Translated Movies by LUO NIGER" },
      { name: "description", content: "Uganda's #1 source for Luo translated movies, series and animations. Download HD MP4 movies with Luo subtitles by LUO NIGER." },
      { property: "og:title", content: "LUO NIGER | Download Luo Translated Movies by LUO NIGER" },
      { property: "og:description", content: "Uganda's #1 source for Luo translated movies, series and animations. Download HD MP4 movies with Luo subtitles by LUO NIGER." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return <Page />;
}
