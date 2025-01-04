<script setup lang="ts">
import { authApi } from '@/api'
import { authService } from '@/services'
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps<{
  uidb64: string
  token: string
}>()

const state = ref<'tokenInvalid' | 'mailSent' | null>(null)

onBeforeMount(() => {
  authApi
    .activateUser({ uidb64: props.uidb64, token: props.token })
    .then(() => {
      // TODO : add alert
      if (authService.isAuthenticated()) {
        authService.removeToken()
        authService.resetStore()
      }
      router.push({ name: 'login' })
    })
    .catch(() => (state.value = 'tokenInvalid'))
})

function resendEmail(): void {
  authApi.resendActivationEmail({ uidb64: props.uidb64 }).then(() => (state.value = 'mailSent'))
}
</script>

<template>
  <div class="activate-user">
    <template v-if="state === 'tokenInvalid'">
      <img src="../../assets/token-error.svg" alt="token error" class="activate-user__img" />
      <p class="text-body-1 text-center mb-0">
        The token is invalid or it may be expired. <br />
        Click on the button bellow to resend an email.
      </p>
      <v-btn variant="outlined" color="info" @click="resendEmail()">Resend email</v-btn>
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
