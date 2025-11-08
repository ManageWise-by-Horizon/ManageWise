import type { User } from "@/lib/auth/auth-context"

/**
 * Get full name from user object
 * @param user - User object with firstName and lastName
 * @returns Full name (firstName + lastName)
 */
export function getUserFullName(user: User | { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`.trim()
}

/**
 * Get initials from user object
 * @param user - User object with firstName and lastName
 * @returns Initials (first letter of firstName + first letter of lastName)
 */
export function getUserInitials(user: User | { firstName: string; lastName: string }): string {
  const firstInitial = user.firstName?.[0] || ""
  const lastInitial = user.lastName?.[0] || ""
  return `${firstInitial}${lastInitial}`.toUpperCase()
}
