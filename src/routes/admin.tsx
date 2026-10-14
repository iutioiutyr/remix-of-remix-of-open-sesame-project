import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const Page = lazy(() => import("@/app/views/admin/AdminDashboard"));

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin | LUO NIGER" },
      { name: "description", content: "LUO NIGER admin dashboard." },
      { property: "og:title", content: "Admin | LUO NIGER" },
      { property: "og:description", content: "LUO NIGER admin dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  return <Page />;
}
