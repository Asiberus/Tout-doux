<template>
    <v-form ref="form" v-model="userForm.valid" @submit.prevent="registerUser()">
        <v-text-field
            label="Username"
            v-model="userForm.data.username"
            :rules="userForm.rules.username"
            :error-messages="usernameUniqueError"
            @input="validateUsername"
            required
            maxlength="100"
            counter="100"
            autofocus>
        </v-text-field>
        <v-text-field
            label="Email"
            type="email"
            v-model="userForm.data.email"
            :rules="userForm.rules.email"
            :error-messages="emailUniqueError"
            @input="validateEmail"
            validate-on-blur
            required
            maxlength="100"
            counter="100">
        </v-text-field>
        <v-text-field
            label="Password"
            v-model="userForm.data.password1"
            :rules="userForm.rules.password1"
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
            v-model="userForm.data.password2"
            :rules="userForm.rules.password2"
            required
            @input="validatePasswordMatch()"
            :error-messages="passwordMatchError"
            :type="showPassword2 ? 'text' : 'password'"
            :append-icon="showPassword2 ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="showPassword2 = !showPassword2">
        </v-text-field>

        <v-btn
            :disabled="!userForm.valid || userForm.pending"
            :loading="submitLoading"
            type="submit"
            color="green"
            block
            class="mt-4 mb-2">
            Submit
        </v-btn>
        <router-link
            :to="{ name: 'login' }"
            class="text-body-1 green--text text--lighten-1 float-right login-link">
            Go back to login
        </router-link>
    </v-form>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Form } from '@/models/common.model'
import { RegisterPost } from '@/models/register.model'
import { authApi, userApi } from '@/api'
import { ValidatePasswordBody } from '@/api/auth.api'

@Component
export default class Register extends Vue {
    userForm: Form<RegisterPost> = {
        valid: false,
        pending: false,
        data: {
            username: '',
            email: '',
            password1: '',
            password2: '',
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

    showPassword1 = false
    showPassword2 = false

    submitLoading = false

    usernameUniqueError: string | null = null
    emailUniqueError: string | null = null
    passwordMatchError: string | null = null
    passwordValidationErrors: string[] = []

    private usernameValidationTimer?: number = undefined
    private emailValidationTimer?: number = undefined
    private passwordValidationTimer?: number = undefined
    private passwordMatchTimer?: number = undefined

    get form(): Vue & { validate: () => void } {
        return this.$refs.form as Vue & { validate: () => void }
    }

    validateUsername(value: string): void {
        clearTimeout(this.usernameValidationTimer)
        if (value === '') {
            this.usernameUniqueError = null
            return
        }

        this.userForm.pending = true
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
            .finally(() => (this.userForm.pending = false))
    }

    validateEmail(value: string): void {
        clearTimeout(this.emailValidationTimer)
        if (value === '') {
            this.emailUniqueError = null
            return
        }

        this.userForm.pending = true
        this.emailValidationTimer = setTimeout(() => this.isEmailUnique(value), 300)
    }

    private isEmailUnique(value: string): void {
        userApi
            .isEmailUnique({ email: value })
            .then((response: any) => {
                this.emailUniqueError = !response.body.unique ? 'This email is already used' : null
            })
            .catch((error: any) => console.error(error))
            .finally(() => (this.userForm.pending = false))
    }

    validatePasswordStrength(value: string): void {
        this.validatePasswordMatch()

        clearTimeout(this.passwordValidationTimer)
        if (value === '') {
            this.passwordValidationErrors = []
            return
        }

        this.userForm.pending = true
        this.passwordValidationTimer = setTimeout(() => this.testPasswordStrength(value), 400)
    }

    private testPasswordStrength(value: string): void {
        const body: ValidatePasswordBody = { password: value }

        authApi
            .validatePassword(body)
            .then((response: any) => (this.passwordValidationErrors = response.body.errors))
            .catch((error: any) => console.error(error))
            .finally(() => (this.userForm.pending = false))
    }

    validatePasswordMatch(): void {
        clearTimeout(this.passwordMatchTimer)
        const { password1, password2 } = this.userForm.data

        if (!password1 || !password2) {
            this.passwordMatchError = null
        }

        this.userForm.pending = true
        this.passwordMatchTimer = setTimeout(() => {
            this.passwordMatchError =
                password1 && password2 && password1 !== password2
                    ? 'Password is not matching'
                    : null
            this.userForm.pending = false
        }, 300)
    }

    registerUser(): void {
        if (!this.userForm.valid || this.userForm.pending) return

        this.submitLoading = true
        authApi
            .register(this.userForm.data)
            .then(() => this.$router.push({ name: 'login' }))
            .catch((error: any) => console.error(error))
            .finally(() => (this.submitLoading = false))
    }
}
</script>

<style scoped lang="scss">
.login-link {
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}
</style>
