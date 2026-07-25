import { Link } from "wouter"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center space-y-4 bg-background">
      <h1 className="text-6xl font-bold tracking-tight text-primary font-mono">404</h1>
      <p className="text-muted-foreground text-lg">Page not found</p>
      <Link href="/" className="inline-flex mt-4">
        <Button size="lg" className="font-mono">Return Home</Button>
      </Link>
    </div>
  )
}
