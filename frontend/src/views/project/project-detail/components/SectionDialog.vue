<template>
    <v-card class="d-flex flex-column">
        <div class="d-flex justify-end align-center flex-wrap gap-2 px-6 pt-4 pb-2">
            <h4 class="text-h5 text-sm-h4 flex-grow-1">
                {{ section ? 'Update section' : 'New section' }}
            </h4>

            <v-hover v-slot="{ hover }" v-if="section">
                <v-btn
                    @click="emitDeleteSection()"
                    :color="hover || confirmDelete ? 'error' : null"
                    :small="$vuetify.breakpoint.xsOnly">
                    {{ confirmDelete ? 'Are you sure ?' : 'Delete section' }}
                </v-btn>
            </v-hover>
        </div>
        <v-card-text class="flex-grow-1 d-flex flex-column">
            <v-form
                ref="form"
                v-model="sectionForm.valid"
                @submit.prevent="emitSubmitEvent()"
                class="flex-grow-1 d-flex flex-column">
                <v-text-field
                    ref="name"
                    v-model="sectionForm.data.name"
                    label="Name"
                    counter="50"
                    required
                    :rules="sectionForm.rules.name"
                    autofocus>
                </v-text-field>

                <v-spacer></v-spacer>

                <div class="d-flex justify-end gap-2">
                    <v-btn
                        color="success"
                        text
                        type="submit"
                        :disabled="!sectionForm.valid"
                        class="flex-grow-1 flex-md-grow-0">
                        {{ section ? 'update' : 'create' }}
                    </v-btn>
                    <v-btn plain @click="emitCloseEvent()" class="flex-grow-1 flex-md-grow-0">
                        cancel
                    </v-btn>
                </div>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { SectionTask } from '@/models/section.model'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import vuetify from '@/plugins/vuetify'

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
