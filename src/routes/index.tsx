import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const Page = lazy(() => import("@/app/views/Home"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUO NIGER MOVIES | Nigerian Movies & Music" },
      { name: "description", content: "Enjoy Nigerian movies and music with LUO NIGER MOVIES. Browse the collection and download your favourite movies." },
      { property: "og:title", content: "LUO NIGER MOVIES | Nigerian Movies & Music" },
      { property: "og:description", content: "Enjoy Nigerian movies and music with LUO NIGER MOVIES. Browse the collection and download your favourite movies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return <Page />;
}
