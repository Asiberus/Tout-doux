<template>
    <div class="password-reset-requested">
        <template v-if="!resetPasswordRequested">
            <img
                src="../../assets/forgot-password.svg"
                alt="mail sent"
                class="password-reset-requested__img" />

            <v-form
                ref="formRef"
                v-model="form.valid"
                @submit.prevent="submit()"
                class="password-reset-requested__form">
                <v-text-field
                    label="Email"
                    type="email"
                    v-model="form.data.email"
                    :rules="form.rules.email"
                    validate-on-blur
                    required
                    autofocus>
                </v-text-field>

                <v-btn type="submit" color="green" block class="my-2">Reset Password</v-btn>
                <router-link
                    :to="{ name: 'login' }"
                    class="text-body-1 text-link green--text text--lighten-1 float-right">
                    Go back to login
                </router-link>
            </v-form>
        </template>
        <template v-else>
            <img
                src="../../assets/mail-sent.svg"
                alt="mail sent"
                class="password-reset-requested__img" />
            <p class="text-body-1 text-center mb-0">
                An email has been sent to you ! <br />
                Check your inbox to reset your password.
            </p>
            <router-link
                :to="{ name: 'login' }"
                class="text-body-1 text-link green--text text--lighten-1">
                Go back to login
            </router-link>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Form } from '@/models/common.model'
import { ResetPasswordRequestBody } from '@/models/auth.model'
import { authApi } from '@/api'

@Component
export default class ResetPasswordRequest extends Vue {
    @Prop({ required: false, default: '' }) email?: string

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

    resetPasswordRequested = false

    created(): void {
        if (this.email) this.form.data.email = this.email
    }

    get formRef(): Vue & { validate: () => boolean } {
        return this.$refs.formRef as Vue & { validate: () => boolean }
    }

    submit(): void {
        if (!this.formRef.validate()) return

        authApi
            .resetPasswordRequest(this.form.data)
            .then(() => (this.resetPasswordRequested = true))
            .catch((error: any) => console.error(error))
    }
}
</script>

<style scoped lang="scss">
.password-reset-requested {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 16px;

    &__form {
        width: 100%;
    }

    &__img {
        width: clamp(200px, 50%, 300px);
    }
}
</style>
