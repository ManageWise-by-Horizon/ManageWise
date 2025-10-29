import { cleanupOrphanedData } from "@/lib/cascade-delete"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react"
import { createApiUrl } from "@/lib/api-config"

interface CleanupResult {
  success: boolean;
  cleaned: {
    backlogs: number;
    userStories: number;
    tasks: number;
    sprints: number;
    meetings: number;
  };
  errors: any[];
}

export function DatabaseCleanupWidget() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<CleanupResult | null>(null)

  const handleCleanup = async () => {
    setIsLoading(true)
    try {
      const result = await cleanupOrphanedData(createApiUrl(""))
      setLastResult(result)

      const totalCleaned = Object.values(result.cleaned).reduce((sum, count) => sum + count, 0)

      if (result.success && totalCleaned > 0) {
        toast({
          title: "Limpieza completada",
          description: `Se eliminaron ${totalCleaned} elementos huérfanos`,
        })
      } else if (result.success && totalCleaned === 0) {
        toast({
          title: "Base de datos limpia",
          description: "No se encontraron elementos huérfanos",
        })
      } else {
        toast({
          title: "Limpieza con errores",
          description: `Se limpiaron ${totalCleaned} elementos, pero hubo ${result.errors.length} errores`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar la limpieza",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalCleaned = (result: CleanupResult) => {
    return Object.values(result.cleaned).reduce((sum, count) => sum + count, 0)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Limpieza de Base de Datos
        </CardTitle>
        <CardDescription>
          Elimina datos huérfanos que no están asociados a ningún proyecto activo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleCleanup}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          {isLoading ? "Limpiando..." : "Ejecutar Limpieza"}
        </Button>

        {lastResult && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="font-medium">
                {lastResult.success ? "Completado" : "Con advertencias"}
              </span>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Total eliminado: {getTotalCleaned(lastResult)}</div>
              {Object.entries(lastResult.cleaned).map(([entity, count]) => (
                count > 0 && (
                  <div key={entity} className="ml-2">
                    • {entity}: {count}
                  </div>
                )
              ))}
              {lastResult.errors.length > 0 && (
                <div className="text-red-500">
                  Errores: {lastResult.errors.length}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}