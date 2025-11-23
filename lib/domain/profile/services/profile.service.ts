"use client"

import { getApiClient } from "@/lib/infrastructure/api/api-client"
import type { UserProfile, UpdateUserProfileCommand, GetUserProfileQuery } from "../types/profile.types"

export class ProfileService {
  private api = getApiClient()

  async getUserProfile(query: GetUserProfileQuery): Promise<UserProfile> {
    if (query.userId) {
      return this.api.get<UserProfile>(`/api/v1/user/${query.userId}`)
    } else if (query.userEmail) {
      return this.api.get<UserProfile>(`/api/v1/user/by-email/${encodeURIComponent(query.userEmail)}`)
    } else {
      throw new Error("Either userId or userEmail must be provided")
    }
  }

  async updateUserProfile(userId: string, command: UpdateUserProfileCommand): Promise<UserProfile> {
    return this.api.patch<UserProfile>(`/api/v1/user/${userId}`, command)
  }

  async getAllUsers(): Promise<UserProfile[]> {
    return this.api.get<UserProfile[]>("/api/v1/user")
  }
}

export const profileService = new ProfileService()

