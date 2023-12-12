<template>
    <div class="activate-user">
        <template v-if="state === 'tokenInvalid'">
            <img src="../../assets/token-error.svg" alt="token error" class="activate-user__img" />
            <p class="text-body-1 text-center mb-0">
                The token is invalid or it may be expired. <br />
                Click on the button bellow to resend an email.
            </p>
            <v-btn @click="resendEmail()" outlined color="info">Resend email</v-btn>
        </template>
        <template v-else-if="state === 'mailSent'">
            <img src="../../assets/mail-sent.svg" alt="mail sent" class="activate-user__img" />
            <p class="text-body-1 text-center mb-0">
                An email has been sent to you ! <br />
                Check your inbox to activate your account.
            </p>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { authApi } from '@/api'
import { authService } from '@/services'

@Component
export default class ActivateUser extends Vue {
    @Prop({ default: '', required: true }) uidb64!: string
    @Prop({ default: '', required: true }) token!: string

    state: 'tokenInvalid' | 'mailSent' | null = null

    created() {
        authApi
            .activateUser({ uidb64: this.uidb64, token: this.token })
            .then(() => {
                // TODO : add alert
                if (authService.isAuthenticated()) {
                    authService.removeToken()
                    authService.resetStore()
                }
                this.$router.push({ name: 'login' })
            })
            .catch(() => {
                this.state = 'tokenInvalid'
            })
    }

    resendEmail(): void {
        authApi.resendActivationEmail({ uidb64: this.uidb64 }).then((this.state = 'mailSent'))
    }
}
</script>

<style scoped lang="scss">
.activate-user {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 16px;

    &__img {
        width: clamp(200px, 40vw, 300px);
    }
}
</style>
