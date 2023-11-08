<template>
    <div>
        <template v-if="!passwordReseted">
            <v-form v-model="form.valid" @submit.prevent="submit()">
                <v-text-field
                    label="Password"
                    v-model="form.data.password1"
                    :rules="form.rules.password1"
                    :error-messages="passwordValidationErrors"
                    error-count="6"
                    @input="validatePasswordStrength"
                    required
                    validate-on-blur
                    :type="showPassword1 ? 'text' : 'password'"
                    :append-icon="showPassword1 ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append="showPassword1 = !showPassword1">
                </v-text-field>
                <v-text-field
                    label="Confirm password"
                    v-model="form.data.password2"
                    :rules="form.rules.password2"
                    required
                    @input="validatePasswordMatch()"
                    :error-messages="passwordMatchError"
                    :type="showPassword2 ? 'text' : 'password'"
                    :append-icon="showPassword2 ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append="showPassword2 = !showPassword2">
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
        <template v-else>
            <div class="password-reset-success">
                <img
                    src="../../assets/password-reset-success.svg"
                    width="250"
                    alt="password reset success" />
                <p class="text-body-1 text-center mb-0">
                    Your password has been successfully changed!
                </p>
                <v-btn :to="{ name: 'login' }" outlined color="green">Go back to login</v-btn>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Form } from '@/models/common.model'
import { ResetPasswordBody } from '@/models/auth.model'
import { authApi } from '@/api'

@Component
export default class ResetPassword extends Vue {
    @Prop({ default: '', required: true }) uidb64!: string
    @Prop({ default: '', required: true }) token!: string

    form: Form<Pick<ResetPasswordBody, 'password1' | 'password2'>> = {
        valid: false,
        pending: false,
        data: {
            password1: '',
            password2: '',
        },
        rules: {
            password1: [
                (value: string) => !!value || 'Password is required',
                (value: string) => value.length <= 64 || 'Max 64 characters',
            ],
            password2: [
                (value: string) => !!value || 'Password is required',
                (value: string) => value.length <= 64 || 'Max 64 characters',
            ],
        },
    }

    passwordReseted = false

    showPassword1 = false
    showPassword2 = false
    submitLoading = false

    passwordMatchError: string | null = null
    passwordValidationErrors: string[] = []
    private passwordValidationTimer?: number = undefined
    private passwordMatchTimer?: number = undefined

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
        const { password1, password2 } = this.form.data

        if (!password1 || !password2) {
            this.passwordMatchError = null
        }

        this.form.pending = true
        this.passwordMatchTimer = setTimeout(() => {
            this.passwordMatchError =
                password1 && password2 && password1 !== password2
                    ? 'Password is not matching'
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
            .then(() => (this.passwordReseted = true))
            .catch((error: any) => console.error(error))
    }
}
</script>

<style scoped lang="scss">
.password-reset-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 16px;
}
</style>
