<template>
    <v-dialog :value="dialogState" @input="setDialogStateTo($event)" width="50%">
        <template #activator="{ attrs, on }">
            <slot name="activator" :attrs="attrs" :on="on"></slot>
        </template>
        <v-card>
            <v-card-text class="pa-6">
                <v-form
                    ref="form"
                    v-model="form.valid"
                    @submit.prevent="submit()"
                    class="d-flex flex-column justify-center align-center white--text gap-4">
                    <div class="icon-wrapper mb-2">
                        <span class="icon-content">
                            <slot name="icon">
                                <v-icon x-large>mdi-lock</v-icon>
                            </slot>
                        </span>
                    </div>

                    <h1 class="text-h6">You must confirm your password to validate this action</h1>

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

                    <div class="d-flex justify-center gap-3">
                        <v-btn type="submit" color="success">Submit</v-btn>
                        <v-btn plain @click="setDialogStateTo(false)">Cancel</v-btn>
                    </div>
                </v-form>
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
    width: 50%;
}
</style>
