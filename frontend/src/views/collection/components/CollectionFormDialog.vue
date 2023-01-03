<template>
    <v-card>
        <v-card-title>New collection</v-card-title>
        <v-card-text>
            <v-form ref="form" v-model="collectionForm.valid" @submit.prevent="emitSubmitEvent()">
                <v-row>
                    <v-col>
                        <v-text-field
                            ref="name"
                            v-model="collectionForm.data.name"
                            :rules="collectionForm.rules.name"
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
                            v-model="collectionForm.data.description"
                            :rules="collectionForm.rules.description"
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
                    <v-btn color="success" text type="submit" :disabled="!collectionForm.valid">
                        create
                    </v-btn>
                    <v-btn plain class="ml-1" @click="emitCloseEvent()"> cancel </v-btn>
                </v-card-actions>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component
export default class CollectionFormDialog extends Vue {
    @Prop() isDialogOpen!: boolean

    private collectionForm = {
        valid: false,
        data: {
            name: '',
            description: '',
        },
        rules: {
            name: [
                (value: string) => !!value || 'Collection name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
            description: [
                (value: string) => !!value || 'Collection description is required',
                (value: string) => value.length <= 500 || 'Max 500 characters',
            ],
        },
    }

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get inputName(): Vue & { focus: () => void } {
        return this.$refs.name as Vue & { focus: () => void }
    }

    @Watch('isDialogOpen')
    private onIsDialogOpenChanges(value: boolean): void {
        if (!value) return

        this.form.resetValidation()
        this.collectionForm.data = { name: '', description: '' }
        this.inputName.focus()
    }

    private emitSubmitEvent(): void {
        if (!this.collectionForm.valid) return

        this.$emit('submit', this.collectionForm.data)
    }

    private emitCloseEvent(): void {
        this.$emit('close')
    }
}
</script>

<style scoped lang="scss"></style>
