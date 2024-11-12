<script setup lang="ts">
import { Form } from '@/models/common.model'
import { ResetPasswordRequestBody } from '@/models/auth.model'
import { authApi } from '@/api'
import { onBeforeMount, ref, useTemplateRef } from 'vue'

const props = defineProps<{
  email?: string
}>()

const formRef = useTemplateRef('formRef')

onBeforeMount(() => {
  if (props.email) form.value.data.email = props.email
})

const form = ref<Form<ResetPasswordRequestBody>>({
  valid: false,
  data: {
    email: '',
  },
  rules: {
    email: [
      (value: string): boolean | string => !!value || 'Email is required',
      (value: string): boolean | string => value.length <= 100 || 'Max 100 characters',
      (value: string): boolean | string =>
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,8}$/.test(value) || 'Invalid e-mail address',
    ],
  },
})

const resetPasswordRequested = ref(false)

function submit(): void {
  if (!formRef.value.validate()) return

  authApi
    .resetPasswordRequest(form.value.data)
    .then(() => (resetPasswordRequested.value = true))
    .catch(error => console.error(error))
}
</script>

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
        class="password-reset-requested__form"
        @submit.prevent="submit()">
        <p class="align-self-start text-body-1 font-weight-bold mb-2">
          Enter your email to reset your password.
        </p>

        <v-text-field
          v-model="form.data.email"
          placeholder="Your email"
          type="email"
          :rules="form.rules.email"
          validate-on="blur"
          density="compact"
          required
          autofocus />

        <v-btn type="submit" color="green" block class="my-2">Reset Password</v-btn>
        <router-link
          :to="{ name: 'login' }"
          class="text-body-1 text-link text-green-lighten-1 float-right">
          Go back to login
        </router-link>
      </v-form>
    </template>
    <template v-else>
      <img src="../../assets/mail-sent.svg" alt="mail sent" class="password-reset-requested__img" />
      <p class="text-body-1 text-center mb-0">
        An email has been sent to you ! <br />
        Check your inbox to reset your password.
      </p>
      <router-link :to="{ name: 'login' }" class="text-body-1 text-link text-green-lighten-1">
        Go back to login
      </router-link>
    </template>
  </div>
</template>

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
    width: clamp(200px, 40vw, 300px);
  }
}
</style>
