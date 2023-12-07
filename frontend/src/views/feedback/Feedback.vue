<template>
    <div class="feedback">
        <MainTitle :icon="$vuetify.breakpoint.smAndUp ? 'mdi-comment-quote' : null" class="mb-3">
            Give us a Feedback!
        </MainTitle>

        <p class="text-body-1">
            If you encounter a bug, think about a new amazing functionality or just want to say how
            you use the app, fill the form below!<br />
            Try to be as complete as possible. Every detail will help us to integrate your feedback
            and improve Tout Doux.<br />
            Thank you for the time you take on it!
        </p>

        <v-form ref="form" v-model="form.valid" @submit.prevent="submit()">
            <v-text-field
                label="Title"
                filled
                v-model="form.data.title"
                :rules="form.rules.title"
                counter="100">
            </v-text-field>

            <v-textarea
                label="Message"
                v-model="form.data.message"
                :rules="form.rules.message"
                @keyup.enter.ctrl="submit()"
                counter="2000"
                rows="10"
                filled>
            </v-textarea>

            <div class="d-flex justify-end mt-2">
                <v-btn
                    type="submit"
                    :disabled="!canSubmit"
                    :block="$vuetify.breakpoint.xsOnly"
                    color="success"
                    class="px-6">
                    submit
                </v-btn>
            </div>
        </v-form>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { FeedbackPost } from '@/models/feedback.model'
import { Form } from '@/models/common.model'
import { feedbackApi } from '@/api'
import MainTitle from '@/components/MainTitle.vue'

@Component({ components: { MainTitle } })
export default class FeedbackComponent extends Vue {
    form: Form<FeedbackPost> = {
        valid: false,
        data: {
            title: '',
            message: '',
        },
        rules: {
            title: [(value: string) => value.length <= 100 || 'Max 100 characters'],
            message: [(value: string) => value.length <= 2000 || 'Max 2000 characters'],
        },
    }

    get formRef(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get canSubmit(): boolean {
        const { title, message } = this.form.data
        return this.form.valid && !!title && !!message
    }

    submit(): void {
        if (!this.canSubmit) return

        feedbackApi
            .createFeedback(this.form.data)
            .then(() => {
                console.log('Feedback submit!')
                this.form.data = {
                    title: '',
                    message: '',
                }
                this.formRef.resetValidation()
            })
            .catch((error: any) => console.error(error))
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

@media #{map-get($display-breakpoints, 'md-and-up')} {
    .feedback {
        width: 75%;
    }
}
</style>
