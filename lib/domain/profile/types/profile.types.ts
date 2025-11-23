// Value Objects y Tipos del dominio Profile

export interface UserProfile {
  userId: string  // UUID
  userEmail: string
  userFirstName: string
  userLastName: string
  userPhone: string
  userCountry: string
  userRole: string
  userProfileImgUrl: string | null
}

// Commands
export interface UpdateUserProfileCommand {
  userEmail?: string
  userFirstName?: string
  userLastName?: string
  userPhone?: string
  userCountry?: string
  userRole?: string
  userProfileImgUrl?: string
}

// Queries
export interface GetUserProfileQuery {
  userId?: string
  userEmail?: string
}

