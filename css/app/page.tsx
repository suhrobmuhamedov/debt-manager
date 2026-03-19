"use client"

import { useState } from "react"
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/stat-card"
import { DebtItem } from "@/components/debt-item"
import { EmptyState } from "@/components/empty-state"
import { BottomNav } from "@/components/bottom-nav"
import { ThemeToggle } from "@/components/theme-toggle"

const mockDebts = [
  { id: 1, name: "Aziz Karimov", amount: "500 000 so'm", status: "pending" as const, daysLeft: 5 },
  { id: 2, name: "Malika Tursunova", amount: "1 200 000 so'm", status: "overdue" as const, daysLeft: -3 },
  { id: 3, name: "Jasur Xolmatov", amount: "750 000 so'm", status: "paid" as const },
  { id: 4, name: "Dilnoza Rahimova", amount: "300 000 so'm", status: "pending" as const, daysLeft: 12 },
]

export default function Dashboard() {
  const [showEmpty, setShowEmpty] = useState(false)

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <h1 className="text-lg font-semibold text-foreground">Qarz Daftari</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="px-4 py-4 max-w-md mx-auto space-y-6">
        {/* Stats Grid */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={ArrowUpRight}
              amount="2 450 000"
              label="Berilgan"
              variant="blue"
            />
            <StatCard
              icon={ArrowDownLeft}
              amount="1 800 000"
              label="Olingan"
              variant="purple"
            />
            <StatCard
              icon={Clock}
              amount="350 000"
              label="Muddati o'tgan"
              variant="red"
            />
            <StatCard
              icon={CheckCircle}
              amount="4 200 000"
              label="To'langan"
              variant="green"
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Tezkor amallar</h2>
          <div className="flex gap-3">
            <Button
              className="flex-1 h-12 bg-stat-blue hover:bg-stat-blue/90 text-white font-medium rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Qarz berdim
            </Button>
            <Button
              className="flex-1 h-12 bg-stat-purple hover:bg-stat-purple/90 text-white font-medium rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Qarz oldim
            </Button>
          </div>
        </section>

        {/* Recent Debts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">So'nggi qarzlar</h2>
            <button 
              onClick={() => setShowEmpty(!showEmpty)}
              className="text-xs text-primary font-medium hover:underline"
            >
              {showEmpty ? "Ko'rsatish" : "Yashirish"}
            </button>
          </div>

          {showEmpty ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {mockDebts.map((debt) => (
                <DebtItem
                  key={debt.id}
                  name={debt.name}
                  amount={debt.amount}
                  status={debt.status}
                  daysLeft={debt.daysLeft}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
