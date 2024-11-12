<script setup lang="ts">
import { Form } from '@/models/common.model'
import { authApi, userApi } from '@/api'
import { RegisterPost } from '@/models/auth.model'
import { ref } from 'vue'

const form = ref<Form<RegisterPost>>({
  valid: false,
  pending: false,
  data: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
  rules: {
    username: [
      (value: string): boolean | string => !!value || 'Username is required',
      (value: string): boolean | string => value.length <= 100 || 'Max 100 characters',
    ],
    email: [
      (value: string): boolean | string => !!value || 'Email is required',
      (value: string): boolean | string => value.length <= 100 || 'Max 100 characters',
      (value: string): boolean | string =>
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,8}$/.test(value) || 'Invalid e-mail address',
    ],
    password: [
      (value: string): boolean | string => !!value || 'Password is required',
      (value: string): boolean | string => value.length <= 64 || 'Max 64 characters',
    ],
    confirmPassword: [
      (value: string): boolean | string => !!value || 'Password is required',
      (value: string): boolean | string => value.length <= 64 || 'Max 64 characters',
    ],
  },
})

const submitLoading = ref(false)
const userCreated = ref(false)

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const usernameUniqueError = ref<string | null>(null)
const emailUniqueError = ref<string | null>(null)
const passwordMatchError = ref<string | null>(null)
const passwordValidationErrors = ref<string[]>([])

let usernameValidationTimer: number | undefined = undefined
let emailValidationTimer: number | undefined = undefined
let passwordValidationTimer: number | undefined = undefined
let passwordMatchTimer: number | undefined = undefined

function validateUsername(value: string): void {
  clearTimeout(usernameValidationTimer)
  if (value === '') {
    usernameUniqueError.value = null
    return
  }

  form.value.pending = true
  usernameValidationTimer = setTimeout(() => isUsernameUnique(value), 300)
}

function isUsernameUnique(value: string): void {
  userApi
    .isUsernameUnique({ username: value })
    .then(response => {
      usernameUniqueError.value = !response.unique ? 'This username is already used' : null
    })
    .catch(error => console.error(error))
    .finally(() => (form.value.pending = false))
}

function validateEmail(value: string): void {
  clearTimeout(emailValidationTimer)
  if (value === '') {
    emailUniqueError.value = null
    return
  }

  form.value.pending = true
  emailValidationTimer = setTimeout(() => isEmailUnique(value), 300)
}

function isEmailUnique(value: string): void {
  userApi
    .isEmailUnique({ email: value })
    .then(response => {
      emailUniqueError.value = !response.unique ? 'This email is already used' : null
    })
    .catch(error => console.error(error))
    .finally(() => (form.value.pending = false))
}

function validatePasswordStrength(value: string): void {
  validatePasswordMatch()

  clearTimeout(passwordValidationTimer)
  if (value === '') {
    passwordValidationErrors.value = []
    return
  }

  form.value.pending = true
  passwordValidationTimer = setTimeout(() => testPasswordStrength(value), 500)
}

function testPasswordStrength(value: string): void {
  authApi
    .validatePassword({ password: value })
    .then(response => (passwordValidationErrors.value = response.errors))
    .catch(error => console.error(error))
    .finally(() => (form.value.pending = false))
}

function validatePasswordMatch(): void {
  clearTimeout(passwordMatchTimer)
  const { password, confirmPassword } = form.value.data

  if (!password || !confirmPassword) {
    passwordMatchError.value = null
  }

  form.value.pending = true
  passwordMatchTimer = setTimeout(() => {
    passwordMatchError.value =
      password && confirmPassword && password !== confirmPassword
        ? 'Passwords are not matching'
        : null
    form.value.pending = false
  }, 300)
}

function registerUser(): void {
  if (!form.value.valid || form.value.pending) return

  submitLoading.value = true
  authApi
    .register(form.value.data)
    .then(() => (userCreated.value = true))
    .catch(error => console.error(error))
    .finally(() => (submitLoading.value = false))
}
</script>

<template>
  <div class="register">
    <template v-if="!userCreated">
      <v-form v-model="form.valid" class="register__form" @submit.prevent="registerUser()">
        <v-text-field
          v-model="form.data.username"
          label="Username"
          :rules="form.rules.username"
          :error-messages="usernameUniqueError"
          required
          counter="100"
          autofocus
          @update:model-value="validateUsername">
        </v-text-field>
        <v-text-field
          v-model="form.data.email"
          label="Email"
          type="email"
          :rules="form.rules.email"
          :error-messages="emailUniqueError"
          validate-on="blur"
          required
          counter="100"
          @update:model-value="validateEmail">
        </v-text-field>
        <v-text-field
          v-model="form.data.password"
          label="Password"
          :rules="form.rules.password"
          :error-messages="passwordValidationErrors"
          max-errors="6"
          required
          validate-on="blur"
          :counter="form.data.password.length > 0"
          :type="showPassword ? 'text' : 'password'"
          :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @update:model-value="validatePasswordStrength"
          @click:append="showPassword = !showPassword">
        </v-text-field>
        <v-text-field
          v-model="form.data.confirmPassword"
          label="Confirm password"
          :rules="form.rules.confirmPassword"
          required
          :error-messages="passwordMatchError"
          :counter="form.data.confirmPassword.length > 0"
          :type="showConfirmPassword ? 'text' : 'password'"
          :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @update:model-value="validatePasswordMatch()"
          @click:append="showConfirmPassword = !showConfirmPassword">
        </v-text-field>

        <v-btn
          :disabled="!form.valid || form.pending"
          :loading="submitLoading"
          type="submit"
          color="green"
          block
          class="mt-4 mb-2">
          Create account
        </v-btn>
        <router-link
          :to="{ name: 'login' }"
          class="text-body-1 text-link text-green-lighten-1 float-right">
          Go back to login
        </router-link>
      </v-form>
    </template>
    <template v-else>
      <img src="../../assets/mail-sent.svg" alt="mail sent" class="register__success-img" />
      <h6 class="text-h6 mb-0">Account successfully created!</h6>
      <p class="text-body-1 text-center mb-0">
        The last step to the activation of your account is to
        <span class="font-weight-bold">confirm your email</span>! <br />
        We have sent you a message with a link. Click on it and your account will be ready to use!
      </p>
    </template>
  </div>
</template>

<style scoped lang="scss">
.register {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 16px;

  &__form {
    width: 100%;
  }

  &__success-img {
    width: clamp(200px, 40vw, 300px);
  }
}
</style>
