<script setup lang="ts">
import { Form } from '@/models/common.model'
import { UserPatch } from '@/models/user.model'
import { userApi } from '@/api'
import { useDisplay } from 'vuetify'
import { useUserStore } from '@/store'
import { computed, ref } from 'vue'

const display = useDisplay()
const userStore = useUserStore()

const form = ref<Form<UserPatch>>({
  valid: false,
  pending: false,
  data: {
    username: userStore.user.username, // TODO : test if this work
    firstName: userStore.user.firstName,
    lastName: userStore.user.lastName,
    bio: userStore.user.bio,
  },
  rules: {
    username: [
      (value: string): boolean | string => !!value || 'Username is required',
      (value: string): boolean | string => value.length <= 100 || 'Max 100 characters',
    ],
    firstName: [(value: string): boolean | string => value.length <= 100 || 'Max 100 characters'],
    lastName: [(value: string): boolean | string => value.length <= 100 || 'Max 100 characters'],
    bio: [(value: string): boolean | string => value.length <= 500 || 'Max 500 characters'],
  },
})

const usernameUniqueError = ref<string | null>(null)
let usernameValidationTimer: number | undefined = undefined

const isFormUntouched = computed<boolean>(
  () =>
    form.value.data.username === userStore.user.username &&
    form.value.data.firstName === userStore.user.firstName &&
    form.value.data.lastName === userStore.user.lastName &&
    form.value.data.bio === userStore.user.bio
)

const canSubmit = computed<boolean>(
  () => form.value.valid && !form.value.pending && !isFormUntouched.value
)

const avatarSize = computed<number>(() => {
  if (display.xs) return 75
  else if (display.sm) return 125
  else if (display.md) return 175
  else if (display.width <= 1600) return 225
  else return 250
})

function validateUsername(value: string): void {
  clearTimeout(usernameValidationTimer)
  if (value === '') {
    usernameUniqueError.value = null
    return
  }

  form.value.pending = true
  usernameValidationTimer = setTimeout(() => isUsernameUnique(value), 300)
}

function isUsernameUnique(value: string): void {
  userApi
    .isUsernameUnique({ username: value, excludeId: userStore.user.id })
    .then(response => {
      usernameUniqueError.value = !response.unique ? 'This username is already used' : null
    })
    .catch(error => console.error(error))
    .finally(() => (form.value.pending = false))
}

function submit(): void {
  if (!canSubmit.value) return

  userStore.updateUser(form.value.data)
}
</script>

<template>
  <div class="profile-user">
    <v-form v-model="form.valid" class="flex-grow-1" @submit.prevent="submit()">
      <div class="profile-user__username">
        <v-avatar v-if="display.smAndDown" :size="avatarSize" color="grey-lighten-3" class="avatar">
          <img src="../../../assets/avatar.svg" alt="avatar placeholder" />
        </v-avatar>
        <v-text-field
          v-model="form.data.username"
          label="Username"
          :rules="form.rules.username"
          :error-messages="usernameUniqueError"
          required
          counter="100"
          @update:model-value="validateUsername" />
      </div>

      <v-text-field
        v-model="form.data.firstName"
        label="First Name"
        :rules="form.rules.firstName"
        counter="100" />

      <v-text-field
        v-model="form.data.lastName"
        label="Last Name"
        :rules="form.rules.lastName"
        counter="100" />

      <v-textarea
        v-model="form.data.bio"
        label="Bio"
        :rules="form.rules.bio"
        counter="500"
        rows="4"
        auto-grow
        class="mb-5"
        @keyup.enter.ctrl="submit()" />

      <v-btn
        color="success"
        type="submit"
        :disabled="!canSubmit"
        :block="display.xs"
        class="float-sm-right">
        update
      </v-btn>
    </v-form>

    <v-avatar v-if="display.mdAndUp" :size="avatarSize" color="grey-lighten-3" class="avatar">
      <img src="../../../assets/avatar.svg" alt="avatar placeholder" />
    </v-avatar>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.profile-user {
  display: flex;

  &__username {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;

    @media #{map.get(variables.$display-breakpoints, 'sm-and-up')} {
      gap: 16px;
    }
  }

  .avatar img {
    width: 66.6%;
  }
}

@media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
  .profile-user {
    column-gap: 24px;
  }
}

@media only screen and (width > 1600px) {
  .profile-user {
    column-gap: 48px;

    .avatar {
      margin-right: 24px;
    }
  }
}
</style>
