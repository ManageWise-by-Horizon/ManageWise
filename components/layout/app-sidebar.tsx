"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Calendar,
  Settings,
  CreditCard,
  User,
  LogOut,
  ChevronDown,
  Bot,
  BarChart3,
  Zap,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Proyectos", href: "/projects", icon: FolderKanban },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Notificaciones", href: "/notifications", icon: Bell },
]

const secondaryNavigation = [
  { name: "Planes", href: "/pricing", icon: Zap },
  { name: "Configuración", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-chart-1 to-chart-2">
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 3H4C3.44772 3 3 3.44772 3 4V9C3 9.55228 3.44772 10 4 10H9C9.55228 10 10 9.55228 10 9V4C10 3.44772 9.55228 3 9 3Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M20 3H15C14.4477 3 14 3.44772 14 4V9C14 9.55228 14.4477 10 15 10H20C20.5523 10 21 9.55228 21 9V4C21 3.44772 20.5523 3 20 3Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M9 14H4C3.44772 14 3 14.4477 3 15V20C3 20.5523 3.44772 21 4 21H9C9.55228 21 10 20.5523 10 20V15C10 14.4477 9.55228 14 9 14Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M20 14H15C14.4477 14 14 14.4477 14 15V20C14 20.5523 14.4477 21 15 21H20C20.5523 21 21 20.5523 21 20V15C21 14.4477 20.5523 14 20 14Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M7 7L17 17" stroke="#08f1e5" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">Manage Wize</h1>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-2 hover:bg-sidebar-accent">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name || "Usuario"} />
                <AvatarFallback className="bg-chart-1 text-white">
                  {user.name
                    ? user.name.split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="text-sm font-medium text-sidebar-foreground">{user.name || "Usuario"}</span>
                <span className="text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=profile">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=subscription">
                <CreditCard className="mr-2 h-4 w-4" />
                Suscripción
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings?tab=security">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="pt-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">Configuración</p>
          <div className="space-y-1">
            {secondaryNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Plan Badge */}
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-sidebar-foreground">
                Plan {user.subscription.plan === "premium" ? "Premium" : "Gratuito"}
              </p>
              {user.subscription.plan === "free" && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {user.subscription.tokensUsed}/{user.subscription.tokensLimit} tokens
                </p>
              )}
            </div>
            {user.subscription.plan === "free" && (
              <Link href="/pricing">
                <Button size="sm" className="bg-chart-1 hover:bg-chart-1/90">
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
