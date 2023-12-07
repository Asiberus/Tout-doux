<template>
    <div class="register">
        <template v-if="!userCreated">
            <v-form v-model="form.valid" @submit.prevent="registerUser()" class="register__form">
                <v-text-field
                    label="Username"
                    v-model="form.data.username"
                    :rules="form.rules.username"
                    :error-messages="usernameUniqueError"
                    @input="validateUsername"
                    required
                    counter="100"
                    autofocus>
                </v-text-field>
                <v-text-field
                    label="Email"
                    type="email"
                    v-model="form.data.email"
                    :rules="form.rules.email"
                    :error-messages="emailUniqueError"
                    @input="validateEmail"
                    validate-on-blur
                    required
                    counter="100">
                </v-text-field>
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
                    Create account
                </v-btn>
                <router-link
                    :to="{ name: 'login' }"
                    class="text-body-1 text-link green--text text--lighten-1 float-right">
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
                We have sent you a message with a link. Click on it and your account will be ready
                to use!
            </p>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Form } from '@/models/common.model'
import { authApi, userApi } from '@/api'
import { RegisterPost } from '@/models/auth.model'

@Component
export default class Register extends Vue {
    form: Form<RegisterPost> = {
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
                (value: string) => !!value || 'Username is required',
                (value: string) => value.length <= 100 || 'Max 100 characters',
            ],
            email: [
                (value: string) => !!value || 'Email is required',
                (value: string) => value.length <= 100 || 'Max 100 characters',
                (value: string) =>
                    /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value) || 'Invalid e-mail address',
            ],
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
    userCreated = false

    showPassword = false
    showConfirmPassword = false

    usernameUniqueError: string | null = null
    emailUniqueError: string | null = null
    passwordMatchError: string | null = null
    passwordValidationErrors: string[] = []

    private usernameValidationTimer?: number = undefined
    private emailValidationTimer?: number = undefined
    private passwordValidationTimer?: number = undefined
    private passwordMatchTimer?: number = undefined

    validateUsername(value: string): void {
        clearTimeout(this.usernameValidationTimer)
        if (value === '') {
            this.usernameUniqueError = null
            return
        }

        this.form.pending = true
        this.usernameValidationTimer = setTimeout(() => this.isUsernameUnique(value), 300)
    }

    private isUsernameUnique(value: string): void {
        userApi
            .isUsernameUnique({ username: value })
            .then((response: any) => {
                this.usernameUniqueError = !response.body.unique
                    ? 'This username is already used'
                    : null
            })
            .catch((error: any) => console.error(error))
            .finally(() => (this.form.pending = false))
    }

    validateEmail(value: string): void {
        clearTimeout(this.emailValidationTimer)
        if (value === '') {
            this.emailUniqueError = null
            return
        }

        this.form.pending = true
        this.emailValidationTimer = setTimeout(() => this.isEmailUnique(value), 300)
    }

    private isEmailUnique(value: string): void {
        userApi
            .isEmailUnique({ email: value })
            .then((response: any) => {
                this.emailUniqueError = !response.body.unique ? 'This email is already used' : null
            })
            .catch((error: any) => console.error(error))
            .finally(() => (this.form.pending = false))
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

    registerUser(): void {
        if (!this.form.valid || this.form.pending) return

        this.submitLoading = true
        authApi
            .register(this.form.data)
            .then(() => (this.userCreated = true))
            .catch((error: any) => console.error(error))
            .finally(() => (this.submitLoading = false))
    }
}
</script>

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
        width: clamp(200px, 50%, 300px);
    }
}
</style>
