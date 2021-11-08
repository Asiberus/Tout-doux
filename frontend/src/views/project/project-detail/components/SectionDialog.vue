<template>
    <v-card>
        <v-card-title>New Section</v-card-title>
        <v-card-text>
            <v-form ref="form" v-model="sectionForm.valid" @submit.prevent="emitSubmitEvent">
                <v-row>
                    <v-col>
                        <v-text-field
                            v-model="sectionForm.data.name"
                            label="Name"
                            counter="50"
                            maxlength="50"
                            required
                            :rules="sectionForm.rules.name"
                            autofocus>
                        </v-text-field>
                    </v-col>
                </v-row>
                <v-card-actions class="d-flex justify-end mt-3">
                    <v-btn
                        color="success"
                        small
                        :disabled="!sectionForm.valid"
                        @click="emitSubmitEvent">
                        <v-icon>mdi-check</v-icon>
                    </v-btn>
                    <v-btn color="error" small class="ml-1" @click="emitCloseEvent">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </v-card-actions>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class SectionDialog extends Vue {
    @Prop() isDialogOpen!: boolean

    private sectionForm = {
        valid: false,
        data: {
            name: '',
        },
        rules: {
            name: [
                (value: string) => !!value || 'Section name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
        },
    }

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    @Watch('isDialogOpen')
    onIsDialogOpenChanges(value: boolean): void {
        if (value) {
            this.form.resetValidation()
            this.sectionForm.data.name = ''
        }
    }

    emitSubmitEvent(): void {
        if (!this.sectionForm.valid) return

        this.$emit('submit', this.sectionForm.data)
    }

    emitCloseEvent(): void {
        this.$emit('close')
    }
}
</script>

<style scoped lang="scss"></style>
