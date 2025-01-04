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

export interface ResendActivationEmailBody {
  uidb64: string
}

export interface ValidatePasswordBody {
  password: string
}

export interface ValidatePasswordResponse {
  errors: string[]
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

export interface ConfirmEmailBody {
  token: string
}

export interface CheckTokenBody {
  uidb64: string
  token: string
}

export interface CheckPasswordBody {
  password: string
}
