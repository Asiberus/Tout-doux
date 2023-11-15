<template>
    <div>
        <div class="text-h4 mb-4">Change Password</div>
        <v-form ref="form" v-model="form.valid" @submit.prevent="submit()" class="password-form">
            <v-text-field
                label="Current Password"
                v-model="form.data.currentPassword"
                :rules="form.rules.currentPassword"
                :error-messages="currentPasswordError"
                @input="currentPasswordError = null"
                required
                autocomplete="current-password"
                :type="showCurrentPassword ? 'text' : 'password'"
                :append-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showCurrentPassword = !showCurrentPassword">
            </v-text-field>

            <v-text-field
                label="New Password"
                v-model="form.data.newPassword"
                :rules="form.rules.newPassword"
                :error-messages="newPasswordValidationErrors"
                error-count="6"
                @input="validatePasswordStrength"
                required
                autocomplete="new-password"
                :counter="form.data.newPassword.length > 0"
                :type="showNewPassword ? 'text' : 'password'"
                :append-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showNewPassword = !showNewPassword">
            </v-text-field>

            <v-text-field
                label="Confirm Password"
                v-model="form.data.confirmPassword"
                :rules="form.rules.confirmPassword"
                required
                @input="validatePasswordMatch()"
                autocomplete="none"
                :error-messages="passwordMatchError"
                :counter="form.data.confirmPassword.length > 0"
                :type="showConfirmPassword ? 'text' : 'password'"
                :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showConfirmPassword = !showConfirmPassword">
            </v-text-field>

            <v-btn
                :disabled="!form.valid || form.pending"
                type="submit"
                color="green"
                class="mt-2 float-right">
                Change Password
            </v-btn>
        </v-form>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { UserChangePassword } from '@/models/user.model'
import { Form } from '@/models/common.model'
import { authApi, userApi } from '@/api'

@Component
export default class ProfilePassword extends Vue {
    form: Form<UserChangePassword> = {
        valid: false,
        pending: false,
        data: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        rules: {
            currentPassword: [
                (value: string) => !!value || 'Password is required',
                (value: string) => value.length <= 64 || 'Max 64 characters',
            ],
            newPassword: [
                (value: string) => !!value || 'Password is required',
                (value: string) => value.length <= 64 || 'Max 64 characters',
            ],
            confirmPassword: [
                (value: string) => !!value || 'Password is required',
                (value: string) => value.length <= 64 || 'Max 64 characters',
            ],
        },
    }

    showCurrentPassword = false
    showNewPassword = false
    showConfirmPassword = false

    currentPasswordError: string | null = null
    newPasswordValidationErrors: string[] = []
    passwordMatchError: string | null = null
    private newPasswordValidationTimer?: number = undefined
    private passwordMatchTimer?: number = undefined

    get formRef(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    validatePasswordStrength(value: string): void {
        this.validatePasswordMatch()

        clearTimeout(this.newPasswordValidationTimer)
        if (value === '') {
            this.newPasswordValidationErrors = []
            return
        }

        this.form.pending = true
        this.newPasswordValidationTimer = setTimeout(() => this.testPasswordStrength(value), 400)
    }

    private testPasswordStrength(value: string): void {
        authApi
            .validatePassword({ password: value })
            .then((response: any) => (this.newPasswordValidationErrors = response.body.errors))
            .catch((error: any) => console.error(error))
            .finally(() => (this.form.pending = false))
    }

    validatePasswordMatch(): void {
        clearTimeout(this.passwordMatchTimer)
        const { newPassword, confirmPassword } = this.form.data

        if (!newPassword || !confirmPassword) {
            this.passwordMatchError = null
        }

        this.form.pending = true
        this.passwordMatchTimer = setTimeout(() => {
            this.passwordMatchError =
                newPassword && confirmPassword && newPassword !== confirmPassword
                    ? 'Passwords are not matching'
                    : null
            this.form.pending = false
        }, 300)
    }

    submit(): void {
        if (!this.form.valid || this.form.pending) return

        userApi
            .changePassword(this.form.data)
            .then(() => {
                this.form.data = { currentPassword: '', newPassword: '', confirmPassword: '' }
                this.formRef.resetValidation()
            })
            .catch((error: any) => {
                if (error.status === 403) this.currentPasswordError = 'Incorrect Password'
            })
    }
}
</script>

<style scoped lang="scss">
.password-form {
    width: 75%;
}
</style>
