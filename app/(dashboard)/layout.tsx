"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { HydrationSafeDiv } from "@/components/ui/hydration-safe-div"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isMounted } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isMounted && !isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router, isMounted])

  // Prevent hydration mismatch by not rendering auth-dependent content until mounted
  if (!isMounted || isLoading || !user) {
    return (
      <HydrationSafeDiv className="flex h-screen items-center justify-center bg-background">
        <HydrationSafeDiv className="text-center">
          <HydrationSafeDiv className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </HydrationSafeDiv>
      </HydrationSafeDiv>
    )
  }

  return (
    <HydrationSafeDiv className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <HydrationSafeDiv className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </HydrationSafeDiv>
    </HydrationSafeDiv>
  )
}
