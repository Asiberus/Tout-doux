export interface RegisterPost {
    username: string
    email: string
    password: string
    confirmPassword: string
}

export interface ActivateUserBody {
    uidb64: string
    token: string
}

export interface ValidatePasswordBody {
    password: string
}

export interface ResetPasswordRequestBody {
    email: string
}

export interface ResetPasswordBody {
    uidb64: string
    token: string
    password: string
    confirmPassword: string
}
