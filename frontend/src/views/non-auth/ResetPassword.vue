<template>
    <div class="password-reset">
        <template v-if="state === 'tokenValid'">
            <v-form v-model="form.valid" @submit.prevent="submit()" class="password-reset__form">
                <v-text-field
                    label="Password"
                    v-model="form.data.password"
                    :rules="form.rules.password"
                    :error-messages="passwordValidationErrors"
                    error-count="6"
                    @input="validatePasswordStrength"
                    required
                    validate-on-blur
                    :counter="form.data.password.length > 0"
                    :type="showPassword ? 'text' : 'password'"
                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append="showPassword = !showPassword">
                </v-text-field>

                <v-text-field
                    label="Confirm password"
                    v-model="form.data.confirmPassword"
                    :rules="form.rules.confirmPassword"
                    required
                    @input="validatePasswordMatch()"
                    :error-messages="passwordMatchError"
                    :counter="form.data.confirmPassword.length > 0"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
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
                width="250"
                alt="password reset success" />
            <p class="text-body-1 text-center mb-0">Your password has been successfully changed!</p>
            <v-btn :to="{ name: 'login' }" outlined color="green">Go back to login</v-btn>
        </template>
        <template v-else-if="state === 'tokenInvalid'">
            <img src="../../assets/token-error.svg" width="250" alt="token error" />
            <p class="text-body-1 text-center mb-0">
                The token is invalid or it may be expired. <br />
                Please restart the process to change your password.
            </p>
            <v-btn :to="{ name: 'login' }" outlined color="error">Go back</v-btn>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Form } from '@/models/common.model'
import { ResetPasswordBody } from '@/models/auth.model'
import { authApi } from '@/api'
import { authService } from '@/services'
import { checkToken } from '@/api/auth.api'

@Component
export default class ResetPassword extends Vue {
    @Prop({ default: '', required: true }) uidb64!: string
    @Prop({ default: '', required: true }) token!: string

    state: 'tokenValid' | 'tokenInvalid' | 'passwordChanged' | null = null

    form: Form<Pick<ResetPasswordBody, 'password' | 'confirmPassword'>> = {
        valid: false,
        pending: false,
        data: {
            password: '',
            confirmPassword: '',
        },
        rules: {
            password: [
                (value: string) => !!value || 'Password is required',
                (value: string) => value.length <= 64 || 'Max 64 characters',
            ],
            confirmPassword: [
                (value: string) => !!value || 'Password is required',
                (value: string) => value.length <= 64 || 'Max 64 characters',
            ],
        },
    }

    submitLoading = false

    showPassword = false
    showConfirmPassword = false

    passwordMatchError: string | null = null
    passwordValidationErrors: string[] = []
    private passwordValidationTimer?: number = undefined
    private passwordMatchTimer?: number = undefined

    created() {
        authApi
            .checkToken({ uidb64: this.uidb64, token: this.token })
            .then((response: any) => {
                this.state = response.body.valid ? 'tokenValid' : 'tokenInvalid'
            })
            .catch(() => (this.state = 'tokenInvalid'))
    }

    validatePasswordStrength(value: string): void {
        this.validatePasswordMatch()

        clearTimeout(this.passwordValidationTimer)
        if (value === '') {
            this.passwordValidationErrors = []
            return
        }

        this.form.pending = true
        this.passwordValidationTimer = setTimeout(() => this.testPasswordStrength(value), 400)
    }

    private testPasswordStrength(value: string): void {
        authApi
            .validatePassword({ password: value })
            .then((response: any) => (this.passwordValidationErrors = response.body.errors))
            .catch((error: any) => console.error(error))
            .finally(() => (this.form.pending = false))
    }

    validatePasswordMatch(): void {
        clearTimeout(this.passwordMatchTimer)
        const { password, confirmPassword } = this.form.data

        if (!password || !confirmPassword) {
            this.passwordMatchError = null
        }

        this.form.pending = true
        this.passwordMatchTimer = setTimeout(() => {
            this.passwordMatchError =
                password && confirmPassword && password !== confirmPassword
                    ? 'Passwords are not matching'
                    : null
            this.form.pending = false
        }, 300)
    }

    submit(): void {
        const data: ResetPasswordBody = {
            uidb64: this.uidb64,
            token: this.token,
            ...this.form.data,
        }

        authApi
            .resetPassword(data)
            .then(() => {
                this.state = 'passwordChanged'
                if (authService.isAuthenticated()) {
                    authService.removeToken()
                    authService.resetStore()
                }
            })
            .catch((error: any) => console.error(error))
    }
}
</script>

<style scoped lang="scss">
.password-reset {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 16px;

    &__form {
        width: 100%;
    }
}
</style>
