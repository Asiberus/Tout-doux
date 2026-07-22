export interface LoginPost {
  email: string
  password: string
}

export interface LoginResponse {
  expiry: string
  token: string
}
