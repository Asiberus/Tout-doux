<script setup lang="ts">
import { UserChangePassword } from '@/models/user.model'
import { Form } from '@/models/common.model'
import { authApi, userApi } from '@/api'
import TertiaryTitle from '@/components/TertiaryTitle.vue'
import { ref, useTemplateRef } from 'vue'

const formRef = useTemplateRef('form')

const form = ref<Form<UserChangePassword>>({
  valid: false,
  pending: false,
  data: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
  rules: {
    currentPassword: [
      (value: string): boolean | string => !!value || 'Password is required',
      (value: string): boolean | string => value.length <= 64 || 'Max 64 characters',
    ],
    newPassword: [
      (value: string): boolean | string => !!value || 'Password is required',
      (value: string): boolean | string => value.length <= 64 || 'Max 64 characters',
    ],
    confirmPassword: [
      (value: string): boolean | string => !!value || 'Password is required',
      (value: string): boolean | string => value.length <= 64 || 'Max 64 characters',
    ],
  },
})

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const currentPasswordError = ref<string | null>(null)
const newPasswordValidationErrors = ref<string[]>([])
const passwordMatchError = ref<string | null>(null)
let newPasswordValidationTimer: number | undefined = undefined
let passwordMatchTimer: number | undefined = undefined

function validatePasswordStrength(value: string): void {
  validatePasswordMatch()

  clearTimeout(newPasswordValidationTimer)
  if (value === '') {
    newPasswordValidationErrors.value = []
    return
  }

  form.value.pending = true
  newPasswordValidationTimer = setTimeout(() => testPasswordStrength(value), 400)
}

function testPasswordStrength(value: string): void {
  authApi
    .validatePassword({ password: value })
    .then(response => (newPasswordValidationErrors.value = response.errors))
    .catch(error => console.error(error))
    .finally(() => (form.value.pending = false))
}

function validatePasswordMatch(): void {
  clearTimeout(passwordMatchTimer)
  const { newPassword, confirmPassword } = form.value.data

  if (!newPassword || !confirmPassword) {
    passwordMatchError.value = null
  }

  form.value.pending = true
  passwordMatchTimer = setTimeout(() => {
    passwordMatchError.value =
      newPassword && confirmPassword && newPassword !== confirmPassword
        ? 'Passwords are not matching'
        : null
    form.value.pending = false
  }, 300)
}

function submit(): void {
  if (!form.value.valid || form.value.pending) return

  userApi
    .changePassword(form.value.data)
    .then(() => {
      form.value.data = { currentPassword: '', newPassword: '', confirmPassword: '' }
      formRef.value.resetValidation()
    })
    .catch(error => {
      if (error.status === 403) currentPasswordError.value = 'Incorrect Password'
    })
}
</script>

<template>
  <div>
    <TertiaryTitle>Change Password</TertiaryTitle>

    <v-form ref="form" v-model="form.valid" class="password-form" @submit.prevent="submit()">
      <v-text-field
        v-model="form.data.currentPassword"
        label="Current Password"
        :rules="form.rules.currentPassword"
        :error-messages="currentPasswordError"
        required
        autocomplete="current-password"
        :type="showCurrentPassword ? 'text' : 'password'"
        :append-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
        @update:model-value="currentPasswordError = null"
        @click:append="showCurrentPassword = !showCurrentPassword" />

      <v-text-field
        v-model="form.data.newPassword"
        label="New Password"
        :rules="form.rules.newPassword"
        :error-messages="newPasswordValidationErrors"
        max-errors="6"
        required
        autocomplete="new-password"
        :counter="form.data.newPassword.length > 0"
        :type="showNewPassword ? 'text' : 'password'"
        :append-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
        @update:model-value="validatePasswordStrength"
        @click:append="showNewPassword = !showNewPassword" />

      <v-text-field
        v-model="form.data.confirmPassword"
        label="Confirm Password"
        :rules="form.rules.confirmPassword"
        required
        autocomplete="none"
        :error-messages="passwordMatchError"
        :counter="form.data.confirmPassword.length > 0"
        :type="showConfirmPassword ? 'text' : 'password'"
        :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
        @update:model-value="validatePasswordMatch()"
        @click:append="showConfirmPassword = !showConfirmPassword" />

      <v-btn
        type="submit"
        :disabled="!form.valid || form.pending"
        :block="$vuetify.breakpoint.xs"
        color="green"
        class="mt-5 float-sm-right">
        Change Password
      </v-btn>
    </v-form>
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .password-form {
    width: 75%;
  }
}
</style>
