<template>
    <div>
        <template v-if="!passwordResetRequested">
            <v-form ref="formRef" v-model="form.valid" @submit.prevent="submit()">
                <v-text-field
                    label="Email"
                    type="email"
                    v-model="form.data.email"
                    :rules="form.rules.email"
                    validate-on-blur
                    required
                    maxlength="100"
                    autofocus>
                </v-text-field>

                <v-btn type="submit" color="green" block class="my-2">Reset Password</v-btn>
                <router-link
                    :to="{ name: 'login' }"
                    class="text-body-1 green--text text--lighten-1 float-right login-link">
                    Go back to login
                </router-link>
            </v-form>
        </template>
        <template v-else>
            <div class="password-reset-requested">
                <img src="../../assets/mail-sent.svg" width="250" alt="mail sent" />
                <p class="text-body-1 text-center mb-0">
                    An email has been sent to you ! <br />
                    Check your inbox to reset your password.
                </p>
                <router-link
                    :to="{ name: 'login' }"
                    class="text-body-1 green--text text--lighten-1">
                    Go back to login
                </router-link>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Form } from '@/models/common.model'
import { ResetPasswordRequestBody } from '@/models/auth.model'
import { authApi } from '@/api'

@Component
export default class ResetPasswordRequest extends Vue {
    form: Form<ResetPasswordRequestBody> = {
        valid: false,
        data: {
            email: '',
        },
        rules: {
            email: [
                (value: string) => !!value || 'Email is required',
                (value: string) => value.length <= 100 || 'Max 100 characters',
                (value: string) =>
                    /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value) || 'Invalid e-mail address',
            ],
        },
    }

    passwordResetRequested = false

    get formRef(): Vue & { validate: () => boolean } {
        return this.$refs.formRef as Vue & { validate: () => boolean }
    }

    submit(): void {
        if (!this.formRef.validate()) return

        authApi
            .resetPasswordRequest(this.form.data)
            .then(() => (this.passwordResetRequested = true))
            .catch((error: any) => console.error(error))
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

.password-reset-requested {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 8px;

    a {
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>
