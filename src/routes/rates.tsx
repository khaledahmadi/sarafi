import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/rates')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/rates"!</div>
}
