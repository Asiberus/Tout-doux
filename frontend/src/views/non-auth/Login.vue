<template>
    <v-form class="login" @submit.prevent="login()">
        <v-text-field label="Email" v-model="form.data.email" autofocus hide-details>
        </v-text-field>

        <v-text-field
            label="Password"
            v-model="form.data.password"
            :type="showPassword ? 'text' : 'password'"
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="showPassword = !showPassword"
            hide-details>
        </v-text-field>

        <p
            class="error-message text-subtitle-1 error--text text-center mb-0"
            :class="{ active: credentialsError }">
            Invalid credentials
        </p>

        <v-btn :disabled="!form.valid" :loading="loading" type="submit" color="success">
            login
        </v-btn>

        <div class="login__links">
            <router-link
                :to="{ name: 'register' }"
                class="text-body-1 text-link green--text text--lighten-1">
                Create account
            </router-link>
            <router-link
                :to="{
                    name: 'password-reset-request',
                    query: { email: form.data.email || undefined },
                }"
                class="text-body-1 text-link green--text text--lighten-1">
                Forgot password ?
            </router-link>
        </div>
    </v-form>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Form } from '@/models/common.model'
import { authService } from '@/services'
import { LoginPost } from '@/models/login.model'

@Component
export default class Login extends Vue {
    form: Form<LoginPost> = {
        valid: false,
        data: {
            email: '',
            password: '',
        },
    }

    credentialsError = false
    showPassword = false
    loading = false

    @Watch('form.data', { deep: true })
    private onFormDataChanges(data: LoginPost): void {
        this.credentialsError = false
        this.form.valid = !!data.email && !!data.password
    }

    login(): void {
        if (!this.form.valid) return

        this.loading = true
        authService
            .login(this.form.data)
            .then(() => {
                this.$store.dispatch('init').then(() => {
                    const next = this.$route.query.next
                    // We need to catch the error here when a navigation guard block the navigation
                    if (next && typeof next === 'string') this.$router.push(next).catch(() => {})
                    else this.$router.push({ name: 'home' })
                })
            })
            .catch(() => {
                this.credentialsError = true
            })
            .finally(() => (this.loading = false))
    }
}
</script>

<style scoped lang="scss">
.login {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    row-gap: 8px;

    .error-message {
        opacity: 0;
        transition: opacity 0.1s ease-in-out;

        &.active {
            opacity: 1;
        }
    }

    &__links {
        display: flex;
        justify-content: space-between;
    }
}
</style>
