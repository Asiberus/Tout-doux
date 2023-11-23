<template>
    <v-card>
        <v-card-title>
            <h4 class="text-h4">New collection</h4>
        </v-card-title>
        <v-card-text>
            <v-form ref="form" v-model="collectionForm.valid" @submit.prevent="emitSubmitEvent()">
                <v-text-field
                    ref="name"
                    v-model="collectionForm.data.name"
                    :rules="collectionForm.rules.name"
                    label="Name"
                    counter="50"
                    required
                    autofocus
                    class="mb-2">
                </v-text-field>

                <v-textarea
                    v-model="collectionForm.data.description"
                    :rules="collectionForm.rules.description"
                    @keyup.enter.ctrl="emitSubmitEvent()"
                    label="Description"
                    counter="500"
                    required
                    rows="1"
                    auto-grow
                    class="mb-2">
                </v-textarea>

                <div class="item-name-wrapper mb-2">
                    <v-text-field
                        v-model="collectionForm.data.itemName"
                        :rules="collectionForm.rules.itemName"
                        label="Item name"
                        counter="15"
                        required>
                    </v-text-field>
                </div>

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
import { Form } from '@/models/common.model'
import { CollectionPost } from '@/models/collection.model'

@Component
export default class CollectionFormDialog extends Vue {
    @Prop({ required: true }) isDialogOpen!: boolean

    collectionForm: Form<CollectionPost> = {
        valid: false,
        data: {
            name: '',
            description: '',
            itemName: 'task',
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
            itemName: [
                (value: string) => !!value || 'This field is required',
                (value: string) => value.length <= 15 || 'Max 15 characters',
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
        this.inputName.focus()
        this.collectionForm.data = { name: '', description: '', itemName: 'task' }
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

<style scoped lang="scss">
.item-name-wrapper {
    width: calc(100% / 3);
}
</style>
