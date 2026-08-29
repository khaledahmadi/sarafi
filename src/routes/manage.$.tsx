import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/manage/$")({
  beforeLoad: ({ params }) => {
    throw redirect({ href: `/dashboard/${params._splat}` });
  },
});
