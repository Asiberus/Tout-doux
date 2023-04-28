<template>
    <div class="login">
        <h1 class="text-h1 green--text mb-6">Tout Doux</h1>
        <v-form class="login__form" @submit.prevent="login()">
            <v-text-field v-model="form.data.email" label="Email" autofocus hide-details>
            </v-text-field>

            <v-text-field
                v-model="form.data.password"
                :type="showPassword ? 'text' : 'password'"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showPassword = !showPassword"
                label="Password"
                hide-details>
            </v-text-field>

            <p
                class="error-message text-subtitle-1 error--text text-center mb-0"
                :class="{ active: credentialsError }">
                Invalid credentials
            </p>

            <v-btn :disabled="!form.valid" :loading="loading" type="submit">login</v-btn>
        </v-form>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Form } from '@/models/common.model'
import { authService } from '@/services'
import { preferencesActions } from '@/store/modules/preferences.store'
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
                // Fetch preferences
                this.$store.dispatch(preferencesActions.getPreferences)

                const next = this.$route.query.next
                if (next && typeof next === 'string') this.$router.push(next)
                else this.$router.push({ name: 'home' })
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
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    &__form {
        min-width: 20%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        row-gap: 20px;

        .error-message {
            opacity: 0;
            transition: opacity 0.1s ease-in-out;

            &.active {
                opacity: 1;
            }
        }
    }
}
</style>
