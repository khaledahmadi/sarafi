import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/manage")({
  beforeLoad: ({ location }) => {
    const rest = location.pathname.replace(/^\/manage\/?/, "");
    throw redirect({ href: rest ? `/dashboard/${rest}` : "/dashboard" });
  },
});
