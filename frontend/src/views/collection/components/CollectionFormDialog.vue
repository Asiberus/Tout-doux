<template>
    <v-card class="d-flex flex-column">
        <div class="px-6 pt-4 pb-2">
            <h4 class="text-h5 text-sm-h4">New collection</h4>
        </div>
        <v-card-text class="flex-grow-1 d-flex flex-column">
            <v-form
                ref="form"
                v-model="collectionForm.valid"
                @submit.prevent="emitSubmitEvent()"
                class="flex-grow-1 d-flex flex-column">
                <div class="inputs-wrapper">
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
                </div>

                <div class="d-flex justify-end gap-2">
                    <v-btn
                        color="success"
                        text
                        type="submit"
                        :disabled="!collectionForm.valid"
                        class="flex-grow-1 flex-md-grow-0">
                        create
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
@import '~vuetify/src/styles/styles.sass';

@media #{map-get($display-breakpoints, 'sm-and-down')} {
    .inputs-wrapper {
        flex: 1 0 0;
        overflow-y: auto;
        overflow-x: hidden;
    }
}

@media #{map-get($display-breakpoints, 'sm-only')} {
    .item-name-wrapper {
        width: 50%;
    }
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
    .item-name-wrapper {
        width: calc(100% / 3);
    }
}
</style>
