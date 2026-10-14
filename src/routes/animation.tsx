import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const Page = lazy(() => import("@/app/views/Animation"));

export const Route = createFileRoute("/animation")({
  head: () => ({
    meta: [
      { title: "Animation | LUO NIGER" },
      { name: "description", content: "Browse and download Luo translated animations by LUO NIGER." },
      { property: "og:title", content: "Animation | LUO NIGER" },
      { property: "og:description", content: "Browse and download Luo translated animations by LUO NIGER." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnimationPage,
});

function AnimationPage() {
  return <Page />;
}
