<template>
    <v-card>
        <v-card-title>New project</v-card-title>
        <v-card-text>
            <v-form ref="form" v-model="projectForm.valid" @submit.prevent="emitSubmitEvent()">
                <v-row>
                    <v-col>
                        <v-text-field
                            v-model="projectForm.data.name"
                            :rules="projectForm.rules.name"
                            label="Name"
                            counter="50"
                            maxlength="50"
                            required
                            autofocus>
                        </v-text-field>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <v-textarea
                            v-model="projectForm.data.description"
                            :rules="projectForm.rules.description"
                            @keyup.enter.ctrl="emitSubmitEvent()"
                            label="Description"
                            counter="500"
                            maxlength="500"
                            required
                            rows="1"
                            auto-grow>
                        </v-textarea>
                    </v-col>
                </v-row>
                <v-card-actions class="d-flex justify-end mt-3">
                    <v-btn color="success" text type="submit" :disabled="!projectForm.valid">
                        create
                    </v-btn>
                    <v-btn plain class="ml-2" @click="emitCloseEvent()">cancel</v-btn>
                </v-card-actions>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class ProjectFormDialog extends Vue {
    @Prop() isDialogOpen!: boolean

    private projectForm = {
        valid: false,
        data: {
            name: '',
            description: '',
        },
        rules: {
            name: [
                (value: string) => !!value || 'Project name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
            description: [
                (value: string) => !!value || 'Project description is required',
                (value: string) => value.length <= 500 || 'Max 500 characters',
            ],
        },
    }

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    @Watch('isDialogOpen')
    private onIsDialogOpenChanges(value: boolean): void {
        if (value) {
            this.form.resetValidation()
            this.projectForm.data = { name: '', description: '' }
        }
    }

    private emitSubmitEvent(): void {
        if (!this.projectForm.valid) return

        this.$emit('submit', this.projectForm.data)
    }

    private emitCloseEvent(): void {
        this.$emit('close')
    }
}
</script>

<style scoped lang="scss"></style>
