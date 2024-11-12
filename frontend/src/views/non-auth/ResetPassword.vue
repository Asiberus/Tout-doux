<script setup lang="ts">
import { Form } from '@/models/common.model'
import { ResetPasswordBody } from '@/models/auth.model'
import { authApi } from '@/api'
import { authService } from '@/services'
import { onBeforeMount, ref } from 'vue'

const props = defineProps<{
  uidb64: string
  token: string
}>()

onBeforeMount(() => {
  authApi
    .checkToken({ uidb64: props.uidb64, token: props.token })
    .then(response => (state.value = response.valid ? 'tokenValid' : 'tokenInvalid'))
    .catch(() => (state.value = 'tokenInvalid'))
})

const state = ref<'tokenValid' | 'tokenInvalid' | 'passwordChanged' | null>(null)

const form = ref<Form<Pick<ResetPasswordBody, 'password' | 'confirmPassword'>>>({
  valid: false,
  pending: false,
  data: {
    password: '',
    confirmPassword: '',
  },
  rules: {
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

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordMatchError = ref<string | null>(null)
const passwordValidationErrors = ref<string[]>([])
let passwordValidationTimer: number | undefined = undefined
let passwordMatchTimer: number | undefined = undefined

function validatePasswordStrength(value: string): void {
  this.validatePasswordMatch()

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

function submit(): void {
  const data: ResetPasswordBody = {
    uidb64: props.uidb64,
    token: props.token,
    ...form.value.data,
  }

  authApi
    .resetPassword(data)
    .then(() => {
      state.value = 'passwordChanged'
      if (authService.isAuthenticated()) {
        authService.removeToken()
        authService.resetStore()
      }
    })
    .catch(error => console.error(error))
}
</script>

<template>
  <div class="password-reset">
    <template v-if="state === 'tokenValid'">
      <v-form v-model="form.valid" class="password-reset__form" @submit.prevent="submit()">
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
          Reset Password
        </v-btn>
      </v-form>
    </template>
    <template v-else-if="state === 'passwordChanged'">
      <img
        src="../../assets/password-reset-success.svg"
        alt="password reset success"
        class="password-reset__img" />
      <p class="text-body-1 text-center mb-0">Your password has been successfully changed!</p>
      <v-btn :to="{ name: 'login' }" variant="outlined" color="green">Go back to login</v-btn>
    </template>
    <template v-else-if="state === 'tokenInvalid'">
      <img src="../../assets/token-error.svg" alt="token error" class="password-reset__img" />
      <p class="text-body-1 text-center mb-0">
        The token is invalid or it may be expired. <br />
        Please restart the process to change your password.
      </p>
      <v-btn :to="{ name: 'login' }" variant="outlined" color="error">Go back</v-btn>
    </template>
  </div>
</template>

<style scoped lang="scss">
.password-reset {
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 16px;

  &__form {
    width: 100%;
  }

  &__img {
    width: clamp(200px, 40vw, 300px);
  }
}
</style>
