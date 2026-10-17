import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const Page = lazy(() => import("@/app/views/Music"));

export const Route = createFileRoute("/music")({
  head: () => ({
    meta: [
      { title: "Music | LUO NIGER MOVIES" },
      { name: "description", content: "Listen to and download Luo music by LUO NIGER MOVIES." },
      { property: "og:title", content: "Music | LUO NIGER MOVIES" },
      { property: "og:description", content: "Listen to and download Luo music by LUO NIGER MOVIES." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MusicPage,
});

function MusicPage() {
  return <Page />;
}
