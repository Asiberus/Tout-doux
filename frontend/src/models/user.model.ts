export interface User {
    id: number
    username: string
    email: string
    firstName: string
    lastName: string
    bio: string
    isActive: boolean
    isStaff: boolean
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
