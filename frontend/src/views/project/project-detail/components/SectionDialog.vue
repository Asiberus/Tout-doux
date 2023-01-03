<template>
    <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
            <span>{{ section ? 'Update section' : 'New section' }}</span>
            <div v-if="section">
                <v-hover v-slot="{ hover }">
                    <v-btn
                        @click="emitDeleteSection()"
                        :color="hover || confirmDelete ? 'error' : null">
                        {{ confirmDelete ? 'Are you sure ?' : 'Delete section' }}
                    </v-btn>
                </v-hover>
            </div>
        </v-card-title>
        <v-card-text>
            <v-form ref="form" v-model="sectionForm.valid" @submit.prevent="emitSubmitEvent()">
                <v-row>
                    <v-col>
                        <v-text-field
                            ref="name"
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
                    <v-btn color="success" text type="submit" :disabled="!sectionForm.valid">
                        {{ section ? 'update' : 'create' }}
                    </v-btn>
                    <v-btn plain class="ml-2" @click="emitCloseEvent()">cancel</v-btn>
                </v-card-actions>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { SectionTask } from '@/models/section.model'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class SectionDialog extends Vue {
    @Prop() private section?: SectionTask
    @Prop() isDialogOpen!: boolean

    confirmDelete = false

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

    get inputName(): Vue & { focus: () => void } {
        return this.$refs.name as Vue & { focus: () => void }
    }

    beforeMount(): void {
        if (this.section) this.populateForm(this.section.name)
    }

    @Watch('isDialogOpen')
    onIsDialogOpenChanges(value: boolean): void {
        if (value) {
            this.confirmDelete = false
            this.form.resetValidation()
            if (this.section) this.populateForm(this.section.name)
            else this.populateForm('')
            this.inputName.focus()
        }
    }

    populateForm(name: string): void {
        this.sectionForm.data.name = name
    }

    emitSubmitEvent(): void {
        if (!this.sectionForm.valid) return

        this.$emit('submit', this.sectionForm.data)
    }

    emitDeleteSection(): void {
        if (!this.confirmDelete) {
            this.confirmDelete = true
            return
        }

        this.$emit('delete')
    }

    emitCloseEvent(): void {
        this.$emit('close')
    }
}
</script>

<style scoped lang="scss"></style>
