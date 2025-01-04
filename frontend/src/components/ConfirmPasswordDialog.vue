<script setup lang="ts">
import { Form } from '@/models/common.model'
import { CheckPasswordBody } from '@/models/auth.model'
import { authApi } from '@/api'
import { getConfirmDialogWidth } from '@/utils/dialog.utils'
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const show = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  confirm: []
  'password-confirmed': []
}>()

const dialogState = ref(false)
const form = ref<Form<CheckPasswordBody>>({
  valid: false,
  data: {
    password: '',
  },
  rules: {
    password: [
      (value: string): boolean | string => !!value || 'Password is required',
      (value: string): boolean | string => value.length <= 64 || 'Max 64 characters',
    ],
  },
})
const showPassword = ref(false)
const passwordError = ref<string | null>('')

const formRef = useTemplateRef('formRef')
const passwordInput = useTemplateRef('passwordInput')

watch(
  () => show,
  value => {
    dialogState.value = value
    form.value.data.password = ''

    if (value) {
      // We need to wait for next tick to access the form and the input name
      nextTick(() => {
        formRef.value.resetValidation()
        passwordInput.value.focus()
      })
    }
  }
)

function setDialogStateTo(value: boolean): void {
  dialogState.value = value
  show.value = value
}

function submit(): void {
  if (!form.value.valid || form.value.pending) return

  authApi
    .checkPassword(form.value.data)
    .then(() => {
      emit('password-confirmed')
      setDialogStateTo(false)
    })
    .catch(error => {
      if (error.status === 403) passwordError.value = 'Incorrect Password'
    })
}
</script>

<template>
  <v-dialog
    :model-value="dialogState"
    :width="getConfirmDialogWidth()"
    :fullscreen="display.xs"
    @update:model-value="setDialogStateTo($event)">
    <template #activator="{ props }">
      <slot name="activator" v-bind="props"></slot>
    </template>
    <v-card class="d-flex flex-column">
      <v-card-text class="flex-grow-1 d-flex flex-column px-6 py-10">
        <v-form
          ref="formRef"
          v-model="form.valid"
          class="flex-grow-1 d-flex flex-column justify-center align-stretch align-sm-center text-white gap-3"
          @submit.prevent="submit()">
          <div class="icon-wrapper">
            <span class="icon-content">
              <slot name="icon">
                <v-icon size="x-large">mdi-lock</v-icon>
              </slot>
            </span>
          </div>

          <h1 class="text-h6 text-center">
            You must confirm your password to validate this action.
          </h1>

          <v-text-field
            ref="passwordInput"
            v-model="form.data.password"
            :type="showPassword ? 'text' : 'password'"
            :rules="form.rules.password"
            :error-messages="passwordError"
            required
            density="compact"
            placeholder="Enter your password"
            autocomplete="current-password"
            autofocus
            :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
            class="password-input"
            @update:model-value="passwordError = null"
            @click:append="showPassword = !showPassword">
          </v-text-field>

          <div class="d-flex justify-center gap-2">
            <v-btn
              variant="plain"
              class="flex-grow-1 flex-sm-grow-0"
              @click="setDialogStateTo(false)">
              Cancel
            </v-btn>
            <v-btn type="submit" color="success" class="flex-grow-1 flex-sm-grow-0"> Submit </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

@keyframes animate-icon-circle {
  from {
    opacity: 0;
    transform: scale(1, 0);
  }
  to {
    opacity: 1;
    transform: scale(1, 1);
  }
}

@keyframes animate-icon-content {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.7);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.icon-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 10rem;
  width: 10rem;
  border-radius: 50%;
  border: 0.4rem solid;
  margin: 0 auto;
  user-select: none;

  animation: animate-icon-circle 0.2s ease-in;

  .icon-content {
    display: flex;
    align-items: center;
    font-size: 3rem;

    animation: animate-icon-content 0.4s cubic-bezier(0.63, 0, 0.39, 1.78);
  }
}

.password-input {
  flex-grow: 0;

  @media #{map.get(variables.$display-breakpoints, 'sm')} {
    width: 75%;
  }

  @media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
    width: 50%;
  }
}
</style>
