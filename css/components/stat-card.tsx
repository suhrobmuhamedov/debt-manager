"use client"

import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  amount: string
  label: string
  variant: "blue" | "purple" | "red" | "green"
}

const variantStyles = {
  blue: "bg-stat-blue-bg text-stat-blue",
  purple: "bg-stat-purple-bg text-stat-purple",
  red: "bg-stat-red-bg text-stat-red",
  green: "bg-stat-green-bg text-stat-green",
}

const iconBgStyles = {
  blue: "bg-stat-blue/15",
  purple: "bg-stat-purple/15",
  red: "bg-stat-red/15",
  green: "bg-stat-green/15",
}

export function StatCard({ icon: Icon, amount, label, variant }: StatCardProps) {
  return (
    <div className={`rounded-xl p-4 ${variantStyles[variant]} transition-all duration-200 active:scale-[0.98]`}>
      <div className={`w-9 h-9 rounded-lg ${iconBgStyles[variant]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <p className="text-xl font-semibold tracking-tight">{amount}</p>
      <p className="text-sm opacity-80 mt-0.5">{label}</p>
    </div>
  )
}
