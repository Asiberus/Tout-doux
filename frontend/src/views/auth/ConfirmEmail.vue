<template>
    <div class="confirm-email">
        <template v-if="state === 'valid'">
            <img
                src="../../assets/confirm-email-success.svg"
                width="250"
                alt="confirm email success" />
            <p class="text-body-1 text-center mb-0">Your email has been successfully changed!</p>
            <v-btn :to="{ name: 'login' }" outlined color="green">Go back to login</v-btn>
        </template>
        <template v-else-if="state === 'invalid'">
            <img src="../../assets/confirm-email-error.svg" width="250" alt="confirm email error" />
            <p class="text-body-1 text-center mb-0">
                Invalid token. Please restart the process to change your email.
            </p>
            <v-btn :to="{ name: 'login' }" outlined color="green">Go back to login</v-btn>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { authApi } from '@/api'

@Component
export default class ConfirmEmail extends Vue {
    @Prop({ default: '', required: true }) token!: string

    state: 'valid' | 'invalid' | null = null

    created(): void {
        authApi
            .confirmEmail({ token: this.token })
            .then(() => (this.state = 'valid'))
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
}
</style>
