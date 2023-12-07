<template>
    <div class="confirm-email">
        <template v-if="state === 'valid'">
            <img
                src="../../assets/confirm-email-success.svg"
                alt="confirm email success"
                class="confirm-email__img" />
            <p class="text-body-1 text-center mb-0">Your email has been successfully changed!</p>
            <v-btn :to="{ name: 'login' }" outlined color="green">Go back to login</v-btn>
        </template>
        <template v-else-if="state === 'invalid'">
            <img
                src="../../assets/token-error.svg"
                alt="confirm email error"
                class="confirm-email__img" />
            <p class="text-body-1 text-center mb-0">
                The token is invalid or it may be expired. <br />
                Please restart the process to change your email.
            </p>
            <v-btn :to="{ name: 'login' }" outlined color="error">Go back</v-btn>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { authApi } from '@/api'
import { authService } from '@/services'

@Component
export default class ConfirmEmail extends Vue {
    @Prop({ default: '', required: true }) token!: string

    state: 'valid' | 'invalid' | null = null

    created(): void {
        authApi
            .confirmEmail({ token: this.token })
            .then(() => {
                this.state = 'valid'
                if (authService.isAuthenticated()) {
                    authService.removeToken()
                    authService.resetStore()
                }
            })
            .catch(() => (this.state = 'invalid'))
    }
}
</script>

<style scoped lang="scss">
.confirm-email {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 16px;

    &__img {
        width: clamp(200px, 50%, 300px);
    }
}
</style>
