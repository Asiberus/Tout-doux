<script setup lang="ts">
import { Form } from '@/models/common.model'
import { authService } from '@/services'
import { LoginPost } from '@/models/login.model'
import { ref, watch } from 'vue'
import { useAppStore } from '@/store'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const form = ref<Form<LoginPost>>({
  valid: false,
  data: {
    email: '',
    password: '',
  },
})

const credentialsError = ref(false)
const showPassword = ref(false)
const loading = ref(false)

watch(form, ({ data }) => {
  // TODO : test if this work
  credentialsError.value = false
  form.value.valid = !!data.email && !!data.password
})

function login(): void {
  if (!form.value.valid) return

  loading.value = true
  authService
    .login(form.value.data)
    .then(() => {
      appStore.init().then(() => {
        const next = route.query.next
        // TODO : if the router is blocked by a guard, navigate to home
        // We need to catch the error here when a navigation guard block the navigation
        if (next && typeof next === 'string') router.push(next).catch(() => {})
        else router.push({ name: 'home' })
      })
    })
    .catch(() => (credentialsError.value = true))
    .finally(() => (loading.value = false))
}
</script>

<template>
  <v-form class="login" @submit.prevent="login()">
    <v-text-field v-model="form.data.email" label="Email" autofocus hide-details />

    <v-text-field
      v-model="form.data.password"
      label="Password"
      :type="showPassword ? 'text' : 'password'"
      :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
      hide-details
      @click:append="showPassword = !showPassword" />

    <p
      class="error-message text-subtitle-1 text-error text-center mb-0"
      :class="{ active: credentialsError }">
      Invalid credentials
    </p>

    <v-btn :disabled="!form.valid" :loading="loading" type="submit" color="success">login</v-btn>

    <div class="login__links">
      <router-link :to="{ name: 'register' }" class="text-body-1 text-link text-green-lighten-1">
        Create account
      </router-link>
      <router-link
        :to="{
          name: 'password-reset-request',
          query: { email: form.data.email || undefined },
        }"
        class="text-body-1 text-link text-green-lighten-1">
        Forgot password ?
      </router-link>
    </div>
  </v-form>
</template>

<style scoped lang="scss">
.login {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  row-gap: 8px;

  .error-message {
    opacity: 0;
    transition: opacity 0.1s ease-in-out;

    &.active {
      opacity: 1;
    }
  }

  &__links {
    display: flex;
    justify-content: space-between;
  }
}
</style>
