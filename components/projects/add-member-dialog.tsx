"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface User {
  id: string
  name: string
  email: string
  role: string
  avatar: string
}

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  currentMembers: string[]
  onMemberAdded: () => void
}

export function AddMemberDialog({
  open,
  onOpenChange,
  projectId,
  currentMembers,
  onMemberAdded,
}: AddMemberDialogProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetchAvailableUsers()
    }
  }, [open])

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`)
      const data = await response.json()
      // Filter out users already in the project
      const availableUsers = data.filter((u: User) => !currentMembers.includes(u.id))
      setUsers(availableUsers)
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
    }
  }

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return

    setIsLoading(true)

    try {
      // Fetch current project
      const projectRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`)
      const project = await projectRes.json()

      // Update project with new members
      const updatedMembers = [...project.members, ...selectedUsers]

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: updatedMembers }),
      })

      toast({
        title: "Miembros agregados",
        description: `${selectedUsers.length} miembro(s) agregado(s) al proyecto`,
      })

      setSelectedUsers([])
      onOpenChange(false)
      onMemberAdded()
    } catch (error) {
      console.error("[v0] Error adding members:", error)
      toast({
        title: "Error",
        description: "No se pudieron agregar los miembros",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; color: string }> = {
      scrum_master: { label: "Scrum Master", color: "bg-chart-1" },
      product_owner: { label: "Product Owner", color: "bg-chart-2" },
      developer: { label: "Developer", color: "bg-chart-3" },
    }
    return roleMap[role] || { label: role, color: "bg-muted" }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Miembros al Proyecto</DialogTitle>
          <DialogDescription>Selecciona los usuarios que deseas agregar</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No hay usuarios disponibles</p>
          ) : (
            users.map((user) => {
              const roleBadge = getRoleBadge(user.role)
              const isSelected = selectedUsers.includes(user.id)

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedUsers([...selectedUsers, user.id])
                        } else {
                          setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                        }
                      }}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback className="bg-chart-1 text-white">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <Badge className={`mt-1 text-xs ${roleBadge.color}`}>{roleBadge.label}</Badge>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddMembers} disabled={isLoading || selectedUsers.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Agregar {selectedUsers.length > 0 && `(${selectedUsers.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
