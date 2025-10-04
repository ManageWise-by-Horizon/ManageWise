"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function PricingPage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const plans = [
    {
      id: "free",
      name: "Gratuito",
      price: 0,
      period: "mes",
      description: "Perfecto para equipos pequeños que están comenzando",
      icon: Zap,
      features: [
        "100 tokens IA por mes",
        "10 user stories por mes",
        "Hasta 3 proyectos activos",
        "Hasta 5 miembros por equipo",
        "Vistas básicas (Board, List)",
        "Soporte por email",
      ],
      limitations: ["Sin dashboards predictivos", "Sin análisis de sentimiento", "Sin exportación de reportes"],
    },
    {
      id: "premium",
      name: "Premium",
      price: 12,
      period: "mes",
      description: "Para equipos profesionales que necesitan todo el poder de la IA",
      icon: Crown,
      popular: true,
      features: [
        "Tokens IA ilimitados",
        "User stories ilimitadas",
        "Proyectos ilimitados",
        "Miembros ilimitados",
        "Todas las vistas (Board, List, Timeline, Calendar)",
        "Dashboards predictivos con ML",
        "Análisis de sentimiento en retrospectivas",
        "Exportación de reportes (PDF, Excel)",
        "Integraciones avanzadas",
        "Soporte prioritario 24/7",
      ],
      limitations: [],
    },
  ]

  const handleUpgrade = async (planId: string) => {
    if (!user) return

    setLoading(true)
    try {
      // Simular llamada a API de pago
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Actualizar plan del usuario
      const updatedUser = {
        ...user,
        subscription: {
          plan: planId as "free" | "premium",
          tokensUsed: user.subscription.tokensUsed,
          tokensLimit: planId === "premium" ? -1 : 100,
          userStoriesUsed: user.subscription.userStoriesUsed,
          userStoriesLimit: planId === "premium" ? -1 : 10,
          startDate: new Date().toISOString(),
          endDate: planId === "premium" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        },
      }

      // Actualizar en localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser))
      updateUser(updatedUser)

      // Actualizar en db.json (simulado)
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: updatedUser.subscription }),
      })

      toast({
        title: planId === "premium" ? "¡Bienvenido a Premium!" : "Plan actualizado",
        description:
          planId === "premium"
            ? "Ahora tienes acceso a todas las funcionalidades avanzadas."
            : "Has cambiado al plan gratuito.",
      })

      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el plan. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
          <Sparkles className="w-3 h-3 mr-1" />
          Planes y Precios
        </Badge>
        <h1 className="text-4xl font-semibold mb-4">Elige el plan perfecto para tu equipo</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Comienza gratis y actualiza cuando necesites más poder. Sin compromisos, cancela cuando quieras.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isCurrentPlan = user?.subscription.plan === plan.id
          const isPremium = plan.id === "premium"

          return (
            <Card
              key={plan.id}
              className={`relative ${plan.popular ? "border-primary shadow-lg shadow-primary/20" : "border-border"}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Más Popular</Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-8 h-8 ${isPremium ? "text-primary" : "text-muted-foreground"}`} />
                  {isCurrentPlan && (
                    <Badge variant="outline" className="text-xs">
                      Plan Actual
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3 text-sm text-muted-foreground">Incluye:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium mb-3 text-sm text-muted-foreground">Limitaciones:</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-muted-foreground text-sm">• {limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan || loading}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {loading
                    ? "Procesando..."
                    : isCurrentPlan
                      ? "Plan Actual"
                      : plan.id === "premium"
                        ? "Actualizar a Premium"
                        : "Cambiar a Gratuito"}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mt-16 text-center">
        <h3 className="text-2xl font-semibold mb-4">¿Preguntas frecuentes?</h3>
        <div className="max-w-3xl mx-auto space-y-4 text-left">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Puedo cambiar de plan en cualquier momento?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplican inmediatamente.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Qué pasa si supero los límites del plan gratuito?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Recibirás notificaciones cuando te acerques a los límites. Una vez alcanzados, necesitarás actualizar a
                Premium para continuar usando las funciones de IA.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Ofrecen descuentos para equipos grandes?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Sí, contáctanos en sales@managewize.com para planes empresariales personalizados con descuentos por
                volumen.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
