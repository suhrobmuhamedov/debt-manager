import { ArrowLeft } from "lucide-react"
import { useLocation } from "wouter"

import { Button } from "../ui/button"

type BackButtonProps = {
  fallback?: string
  label?: string
}

export const BackButton = ({ fallback = "/", label }: BackButtonProps) => {
  const [, navigate] = useLocation()

  return (
    <Button type="button" variant="ghost" className="h-8 gap-1.5 px-2.5 text-xs" onClick={() => navigate(fallback)}>
      <ArrowLeft className="size-4" />
      <span>{label ?? "Back"}</span>
    </Button>
  )
}
