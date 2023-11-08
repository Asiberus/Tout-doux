export interface RegisterPost {
    username: string
    email: string
    password1: string
    password2: string
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
    password1: string
    password2: string
}
