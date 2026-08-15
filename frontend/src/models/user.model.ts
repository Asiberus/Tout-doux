export interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  bio: string
  isActive: boolean
  isStaff: boolean
  lastLogin: string | null
  dateJoined: string
}

export interface UserPatch {
  username: string
  firstName: string
  lastName: string
  bio: string
}

export interface UserChangePassword {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UserChangeEmail {
  email: string
}

export interface UserChangeAccountState {
  active: boolean
}
