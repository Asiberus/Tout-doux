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
    newPassword1: string
    newPassword2: string
}
