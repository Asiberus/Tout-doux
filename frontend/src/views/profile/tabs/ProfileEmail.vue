<template>
    <div class="profile-email">
        <TertiaryTitle>Email Management</TertiaryTitle>

        <p class="text-subtitle-1 mb-1">
            Your current email address is : <span class="font-weight-bold">{{ user.email }}</span>
        </p>
        <p class="text-subtitle-1">
            If you want to change it, fill the input bellow. An email will be sent to the new
            address with a link. <br />
            In order to complete the change, you must click on the link.
        </p>
        <v-form
            ref="form"
            v-model="form.valid"
            @submit.prevent="submit()"
            class="profile-email__form">
            <v-text-field
                label="New Email"
                type="email"
                v-model="form.data.email"
                :rules="form.rules.email"
                :error-messages="emailUniqueError"
                @input="validateEmail"
                validate-on-blur
                counter="100">
            </v-text-field>

            <v-btn :disabled="!form.data.email" type="submit" color="green">Submit</v-btn>
        </v-form>

        <ConfirmPasswordDialog v-model="confirmPasswordDialog" @password-confirmed="changeEmail()">
        </ConfirmPasswordDialog>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { User, UserChangeEmail } from '@/models/user.model'
import { userApi } from '@/api'
import { Form } from '@/models/common.model'
import ConfirmPasswordDialog from '@/components/ConfirmPasswordDialog.vue'
import TertiaryTitle from '@/components/TertiaryTitle.vue'

@Component({
    components: { TertiaryTitle, ConfirmPasswordDialog },
})
export default class ProfileEmail extends Vue {
    form: Form<UserChangeEmail> = {
        valid: false,
        pending: false,
        data: {
            email: '',
        },
        rules: {
            email: [
                (value: string) => value.length <= 100 || 'Max 100 characters',
                (value: string) =>
                    value.length === 0 ||
                    /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value) ||
                    'Invalid e-mail address',
            ],
        },
    }

    emailUniqueError: string | null = null
    private emailValidationTimer?: number = undefined

    confirmPasswordDialog = false

    get user(): User {
        return this.$store.state.user.user
    }

    get formRef(): Vue & { validate: () => boolean; resetValidation: () => void } {
        return this.$refs.form as Vue & { validate: () => boolean; resetValidation: () => void }
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

    submit(): void {
        if (!this.formRef.validate() || !this.form.data.email) return

        this.confirmPasswordDialog = true
    }

    changeEmail(): void {
        userApi
            .changeEmail(this.form.data)
            .then(() => {
                this.form.data.email = ''
                this.formRef.resetValidation()
            })
            .catch((error: any) => console.error(error))
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.profile-email {
    @media #{map-get($display-breakpoints, 'sm-and-up')} {
        width: 75%;
    }

    &__form {
        display: flex;

        gap: 8px;
        flex-direction: column;
        align-items: stretch;

        @media only screen and (width > 400px) {
            flex-direction: row;
            align-items: center;
        }

        @media #{map-get($display-breakpoints, 'md-and-up')} {
            width: 75%;
        }

        @media only screen and (width > 1600px) {
            width: 50%;
        }
    }
}
</style>
