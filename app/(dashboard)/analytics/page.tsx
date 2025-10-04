"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  LineChart,
  Crown,
  Lock,
} from "lucide-react"
import Link from "next/link"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [selectedProject, setSelectedProject] = useState("all")

  if (!user) return null

  const isPremium = user.subscription.plan === "premium"

  // Datos simulados de métricas predictivas
  const predictiveMetrics = {
    sprintCompletion: {
      current: 78,
      predicted: 85,
      trend: "up",
      confidence: 92,
    },
    velocity: {
      current: 42,
      predicted: 48,
      trend: "up",
      confidence: 88,
    },
    riskScore: {
      current: 23,
      predicted: 18,
      trend: "down",
      confidence: 85,
    },
    teamMorale: {
      current: 8.2,
      predicted: 8.5,
      trend: "up",
      confidence: 90,
    },
  }

  const sentimentAnalysis = {
    positive: 65,
    neutral: 25,
    negative: 10,
    insights: [
      "El equipo está satisfecho con la nueva herramienta de CI/CD",
      "Preocupación por la carga de trabajo en el próximo sprint",
      "Buena comunicación entre frontend y backend",
    ],
  }

  const teamPerformance = [
    {
      name: "Ana García",
      role: "Frontend Developer",
      tasksCompleted: 24,
      velocity: 38,
      quality: 95,
      trend: "up",
    },
    {
      name: "Carlos Ruiz",
      role: "Backend Developer",
      tasksCompleted: 28,
      velocity: 42,
      quality: 92,
      trend: "up",
    },
    {
      name: "María López",
      role: "UX Designer",
      tasksCompleted: 18,
      velocity: 32,
      quality: 98,
      trend: "stable",
    },
  ]

  const sprintPredictions = [
    {
      sprint: "Sprint 12",
      predictedCompletion: 88,
      risks: ["Dependencia externa con API de pagos"],
      recommendations: ["Agregar buffer de 2 días para integración"],
    },
    {
      sprint: "Sprint 13",
      predictedCompletion: 92,
      risks: ["Vacaciones de 2 miembros del equipo"],
      recommendations: ["Reducir scope en 15%", "Priorizar tareas críticas"],
    },
  ]

  if (!isPremium) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Dashboards Predictivos</h1>
          <p className="text-muted-foreground">Análisis avanzado con Machine Learning e IA</p>
        </div>

        <Card className="border-primary/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Funcionalidad Premium</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Los dashboards predictivos con Machine Learning están disponibles exclusivamente para usuarios Premium.
              Actualiza tu plan para acceder a análisis avanzados, predicciones de sprints y análisis de sentimiento.
            </p>
            <Link href="/pricing">
              <Button size="lg">
                <Crown className="w-4 h-4 mr-2" />
                Actualizar a Premium
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Dashboards Predictivos</h1>
            <p className="text-muted-foreground">Análisis avanzado con Machine Learning e IA</p>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="predictions">
            <TrendingUp className="w-4 h-4 mr-2" />
            Predicciones
          </TabsTrigger>
          <TabsTrigger value="sentiment">
            <Activity className="w-4 h-4 mr-2" />
            Sentimiento
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="w-4 h-4 mr-2" />
            Equipo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completitud del Sprint</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">{predictiveMetrics.sprintCompletion.current}%</span>
                  <Badge variant="outline" className="text-green">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +7%
                  </Badge>
                </div>
                <Progress value={predictiveMetrics.sprintCompletion.current} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Predicción: {predictiveMetrics.sprintCompletion.predicted}% (
                  {predictiveMetrics.sprintCompletion.confidence}% confianza)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Velocidad del Equipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">{predictiveMetrics.velocity.current}</span>
                  <Badge variant="outline" className="text-green">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +6
                  </Badge>
                </div>
                <Progress value={(predictiveMetrics.velocity.current / 60) * 100} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Predicción: {predictiveMetrics.velocity.predicted} story points (
                  {predictiveMetrics.velocity.confidence}% confianza)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Nivel de Riesgo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">{predictiveMetrics.riskScore.current}%</span>
                  <Badge variant="outline" className="text-green">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -5%
                  </Badge>
                </div>
                <Progress value={predictiveMetrics.riskScore.current} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Predicción: {predictiveMetrics.riskScore.predicted}% ({predictiveMetrics.riskScore.confidence}%
                  confianza)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Moral del Equipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">{predictiveMetrics.teamMorale.current}/10</span>
                  <Badge variant="outline" className="text-green">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +0.3
                  </Badge>
                </div>
                <Progress value={predictiveMetrics.teamMorale.current * 10} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  Predicción: {predictiveMetrics.teamMorale.predicted}/10 ({predictiveMetrics.teamMorale.confidence}%
                  confianza)
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Burndown Chart Predictivo</CardTitle>
                <CardDescription>Progreso actual vs. predicción con ML</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Gráfico de burndown con predicción ML</p>
                    <p className="text-xs mt-1">Visualización simulada</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Velocity Trend</CardTitle>
                <CardDescription>Tendencia de velocidad últimos 6 sprints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Gráfico de velocidad histórica</p>
                    <p className="text-xs mt-1">Visualización simulada</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Predicciones de Sprints Futuros</CardTitle>
              <CardDescription>Análisis predictivo basado en datos históricos y ML</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {sprintPredictions.map((sprint, index) => (
                <div key={index} className="p-4 border border-border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{sprint.sprint}</h3>
                    <Badge variant={sprint.predictedCompletion >= 85 ? "default" : "secondary"}>
                      {sprint.predictedCompletion}% completitud predicha
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Riesgos Identificados
                    </h4>
                    <ul className="space-y-1">
                      {sprint.risks.map((risk, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-500 mt-1">•</span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green" />
                      Recomendaciones
                    </h4>
                    <ul className="space-y-1">
                      {sprint.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Sentimiento</CardTitle>
              <CardDescription>Basado en retrospectivas y comentarios del equipo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Positivo</span>
                    <span className="text-2xl font-bold text-green">{sentimentAnalysis.positive}%</span>
                  </div>
                  <Progress value={sentimentAnalysis.positive} className="h-2" />
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Neutral</span>
                    <span className="text-2xl font-bold text-muted-foreground">{sentimentAnalysis.neutral}%</span>
                  </div>
                  <Progress value={sentimentAnalysis.neutral} className="h-2" />
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Negativo</span>
                    <span className="text-2xl font-bold text-destructive">{sentimentAnalysis.negative}%</span>
                  </div>
                  <Progress value={sentimentAnalysis.negative} className="h-2" />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Insights Clave</h4>
                <div className="space-y-2">
                  {sentimentAnalysis.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                      <Activity className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance del Equipo</CardTitle>
              <CardDescription>Métricas individuales y tendencias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformance.map((member, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <Badge variant="outline">
                        {member.trend === "up" ? (
                          <TrendingUp className="w-3 h-3 mr-1 text-green" />
                        ) : (
                          <Activity className="w-3 h-3 mr-1" />
                        )}
                        {member.trend === "up" ? "Mejorando" : "Estable"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Tareas Completadas</p>
                        <p className="text-2xl font-bold">{member.tasksCompleted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Velocidad</p>
                        <p className="text-2xl font-bold">{member.velocity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Calidad</p>
                        <p className="text-2xl font-bold">{member.quality}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
