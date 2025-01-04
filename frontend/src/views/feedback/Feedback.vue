<script setup lang="ts">
import { FeedbackPost } from '@/models/feedback.model'
import { Form } from '@/models/common.model'
import { feedbackApi } from '@/api'
import MainTitle from '@/components/MainTitle.vue'
import { computed, ref, useTemplateRef } from 'vue'
import { useDisplay } from 'vuetify'

const display = useDisplay()

const formRef = useTemplateRef('form')

const form = ref<Form<FeedbackPost>>({
  valid: false,
  data: {
    title: '',
    message: '',
  },
  rules: {
    title: [(value: string): boolean | string => value.length <= 100 || 'Max 100 characters'],
    message: [(value: string): boolean | string => value.length <= 2000 || 'Max 2000 characters'],
  },
})

const canSubmit = computed<boolean>(() => {
  const { title, message } = form.value.data
  return form.value.valid && !!title && !!message
})

function submit(): void {
  if (!canSubmit.value) return

  feedbackApi
    .createFeedback(form.value.data)
    .then(() => {
      form.value.data = { title: '', message: '' }
      formRef.value.resetValidation()
    })
    .catch(error => console.error(error))
}
</script>

<template>
  <div class="feedback">
    <MainTitle :icon="display.smAndUp ? 'mdi-comment-quote' : null" class="mb-3">
      Give us a Feedback!
    </MainTitle>

    <p class="text-body-1">
      If you encounter a bug, think about a new amazing functionality or just want to say how you
      use the app, fill the form below!<br />
      Try to be as complete as possible. Every detail will help us to integrate your feedback and
      improve Tout Doux.<br />
      Thank you for the time you take on it!
    </p>

    <v-form ref="form" v-model="form.valid" @submit.prevent="submit()">
      <v-text-field
        v-model="form.data.title"
        :rules="form.rules.title"
        label="Title"
        variant="filled"
        counter="100">
      </v-text-field>

      <v-textarea
        v-model="form.data.message"
        :rules="form.rules.message"
        label="Message"
        counter="2000"
        rows="10"
        variant="filled"
        @keyup.enter.ctrl="submit()">
      </v-textarea>

      <div class="d-flex justify-end mt-2">
        <v-btn
          type="submit"
          :disabled="!canSubmit"
          :block="display.xs"
          color="success"
          class="px-6">
          submit
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

@media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
  .feedback {
    width: 75%;
  }
}
</style>
