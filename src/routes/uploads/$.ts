import { createFileRoute } from "@tanstack/react-router";
import { proxyRequest } from "@/routes/api/$";

export const Route = createFileRoute("/uploads/$")({
  server: {
    handlers: {
      GET: proxyRequest,
      OPTIONS: proxyRequest,
    },
  },
});
