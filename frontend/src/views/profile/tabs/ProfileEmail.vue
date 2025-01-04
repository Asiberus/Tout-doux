<script setup lang="ts">
import { UserChangeEmail } from '@/models/user.model'
import { userApi } from '@/api'
import { Form } from '@/models/common.model'
import ConfirmPasswordDialog from '@/components/ConfirmPasswordDialog.vue'
import TertiaryTitle from '@/components/TertiaryTitle.vue'
import { ref, useTemplateRef } from 'vue'
import { useUserStore } from '@/store'

const userStore = useUserStore()

const formRef = useTemplateRef('form')

const form = ref<Form<UserChangeEmail>>({
  valid: false,
  pending: false,
  data: {
    email: '',
  },
  rules: {
    email: [
      (value: string): boolean | string => value.length <= 100 || 'Max 100 characters',
      (value: string): boolean | string =>
        value.length === 0 ||
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,8}$/.test(value) ||
        'Invalid e-mail address',
    ],
  },
})

const confirmPasswordDialog = ref(false)
const emailUniqueError = ref<string | null>(null)
let emailValidationTimer: number | undefined = undefined

function validateEmail(value: string): void {
  clearTimeout(emailValidationTimer)
  if (value === '') {
    emailUniqueError.value = null
    return
  }

  form.value.pending = true
  emailValidationTimer = setTimeout(() => isEmailUnique(value), 300)
}

function isEmailUnique(value: string): void {
  userApi
    .isEmailUnique({ email: value })
    .then(response => {
      emailUniqueError.value = !response.unique ? 'This email is already used' : null
    })
    .catch(error => console.error(error))
    .finally(() => (form.value.pending = false))
}

function submit(): void {
  if (!formRef.value.validate() || !form.value.data.email) return

  confirmPasswordDialog.value = true
}

function changeEmail(): void {
  userApi
    .changeEmail(form.value.data)
    .then(() => {
      form.value.data.email = ''
      formRef.value.resetValidation()
    })
    .catch(error => console.error(error))
}
</script>

<template>
  <div class="profile-email">
    <TertiaryTitle>Email Management</TertiaryTitle>

    <p class="text-subtitle-1 mb-1">
      Your current email address is : <span class="font-weight-bold">{{ user.email }}</span>
    </p>
    <p class="text-subtitle-1">
      If you want to change it, fill the input bellow. An email will be sent to the new address with
      a link. <br />
      In order to complete the change, you must click on the link.
    </p>
    <v-form ref="form" v-model="form.valid" class="profile-email__form" @submit.prevent="submit()">
      <v-text-field
        v-model="form.data.email"
        label="New Email"
        type="email"
        :rules="form.rules.email"
        :error-messages="emailUniqueError"
        validate-on="blur"
        counter="100"
        @update:model-value="validateEmail" />

      <v-btn :disabled="!form.data.email" type="submit" color="green">Submit</v-btn>
    </v-form>

    <ConfirmPasswordDialog v-model="confirmPasswordDialog" @password-confirmed="changeEmail()" />
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.profile-email {
  @media #{map.get(variables.$display-breakpoints, 'sm-and-up')} {
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

    @media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
      width: 75%;
    }

    @media only screen and (width > 1600px) {
      width: 50%;
    }
  }
}
</style>
