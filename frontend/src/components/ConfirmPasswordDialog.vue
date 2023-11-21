<template>
    <v-dialog :value="dialogState" @input="setDialogStateTo($event)" width="50%">
        <template #activator="{ attrs, on }">
            <slot name="activator" :attrs="attrs" :on="on"></slot>
        </template>
        <v-card>
            <v-card-title>
                <h4 class="text-h4">Confirm Your Password</h4>
            </v-card-title>
            <v-card-text>
                <v-form
                    ref="form"
                    v-model="form.valid"
                    @submit.prevent="submit()"
                    class="d-flex align-center gap-3">
                    <v-text-field
                        ref="passwordInput"
                        v-model="form.data.password"
                        :rules="form.rules.password"
                        :error-messages="passwordError"
                        @input="passwordError = null"
                        required
                        placeholder="Enter your password"
                        autocomplete="current-password"
                        autofocus
                        :type="showPassword ? 'text' : 'password'"
                        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append="showPassword = !showPassword"
                        class="password-input">
                    </v-text-field>
                    <v-btn type="submit" color="success">Submit</v-btn>
                </v-form>
                <div class="d-flex justify-end">
                    <v-btn plain @click="setDialogStateTo(false)">Cancel</v-btn>
                </div>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Form } from '@/models/common.model'
import { CheckPasswordBody } from '@/models/auth.model'
import { authApi } from '@/api'

@Component
export default class ConfirmPasswordDialog extends Vue {
    @Prop({ default: false }) value!: boolean
    dialogState = false

    form: Form<CheckPasswordBody> = {
        valid: false,
        data: {
            password: '',
        },
        rules: {
            password: [
                (value: string) => !!value || 'Password is required',
                (value: string) => value.length <= 64 || 'Max 64 characters',
            ],
        },
    }

    showPassword = false
    passwordError: string | null = ''

    get formRef(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get passwordInput(): Vue & { focus: () => void } {
        return this.$refs.passwordInput as Vue & { focus: () => void }
    }

    @Watch('value')
    private onDialogOpening(value: boolean): void {
        this.dialogState = value
        this.form.data.password = ''

        if (value) {
            // We need to wait for next tick to access the form and the input name

            this.$nextTick(() => {
                this.formRef.resetValidation()
                this.passwordInput.focus()
            })
        }
    }

    setDialogStateTo(value: boolean): void {
        this.dialogState = value
        this.$emit('input', value)
    }

    submit(): void {
        if (!this.form.valid || this.form.pending) return

        authApi
            .checkPassword(this.form.data)
            .then(() => {
                this.$emit('password-confirmed')
                this.setDialogStateTo(false)
            })
            .catch((error: any) => {
                if (error.status === 403) this.passwordError = 'Incorrect Password'
            })
    }
}
</script>

<style scoped lang="scss">
.password-input {
    max-width: 50%;
}
</style>
