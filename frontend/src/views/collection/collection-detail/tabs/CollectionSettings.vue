<template>
    <div>
        <div class="d-flex flex-column flex-sm-row align-stretch column-gap-2 row-gap-1 mb-3">
            <h4 class="text-h6 text-sm-h5 flex-grow-1">Settings</h4>

            <div class="d-flex gap-2">
                <ConfirmDialog @confirm="toggleCollectionArchiveState()">
                    <template #activator="{ attrs, on }">
                        <v-btn
                            v-bind="attrs"
                            v-on="on"
                            :outlined="!collection.archived"
                            :small="$vuetify.breakpoint.xsOnly"
                            color="accent"
                            class="flex-grow-1 flex-sm-grow-0">
                            <v-icon small left>mdi-archive</v-icon>
                            {{ collection.archived ? 'unarchive' : 'archive' }}
                        </v-btn>
                    </template>
                    <template #icon>
                        <v-icon x-large>mdi-archive</v-icon>
                    </template>
                    <span>
                        Are you sure to
                        {{ this.collection.archived ? 'unarchive' : 'archive' }} this collection ?
                    </span>
                </ConfirmDialog>
                <template v-if="collection.archived">
                    <ConfirmDialog @confirm="deleteCollection()">
                        <template #activator="{ attrs, on }">
                            <v-btn
                                v-bind="attrs"
                                v-on="on"
                                outlined
                                color="error"
                                :small="$vuetify.breakpoint.xsOnly"
                                class="flex-grow-1 flex-sm-grow-0">
                                <v-icon small left>mdi-trash-can</v-icon>
                                delete
                            </v-btn>
                        </template>
                        <template #icon>
                            <v-icon x-large>mdi-trash-can</v-icon>
                        </template>
                        <p class="mb-1">Are you sure to delete this collection ?</p>
                        <p class="mb-0 font-italic" style="font-size: 1.1rem">
                            All related {{ collection.itemName }} will be deleted
                        </p>
                    </ConfirmDialog>
                </template>
            </div>
        </div>

        <v-form
            ref="form"
            v-model="collectionForm.valid"
            @submit.prevent="updateCollection()"
            class="form-wrapper">
            <v-text-field
                v-model="collectionForm.data.name"
                :rules="collectionForm.rules.name"
                :disabled="collection.archived"
                label="Name"
                counter="50"
                required
                class="mb-2">
            </v-text-field>

            <v-textarea
                v-model="collectionForm.data.description"
                :rules="collectionForm.rules.description"
                :disabled="collection.archived"
                @keyup.enter.ctrl="updateCollection()"
                label="Description"
                counter="500"
                required
                rows="2"
                auto-grow
                class="mb-2">
            </v-textarea>

            <div class="item-name-wrapper mb-2">
                <v-text-field
                    v-model="collectionForm.data.itemName"
                    :rules="collectionForm.rules.itemName"
                    :disabled="collection.archived"
                    label="Item name"
                    counter="15"
                    required>
                </v-text-field>
            </div>

            <div v-if="!collection.archived" class="d-flex justify-end mb-5">
                <v-btn
                    color="success"
                    type="submit"
                    :block="$vuetify.breakpoint.xsOnly"
                    :disabled="!collectionForm.valid || isFormUntouched">
                    update
                </v-btn>
            </div>
        </v-form>
    </div>
</template>

<script lang="ts">
import { collectionService } from '@/api/collection.api'
import { CollectionDetail, CollectionPatch } from '@/models/collection.model'
import { collectionActions } from '@/store/modules/collection.store'
import { Component, Vue } from 'vue-property-decorator'
import { Form } from '@/models/common.model'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

@Component({
    components: { ConfirmDialog },
})
export default class CollectionSettings extends Vue {
    collectionForm: Form<CollectionPatch> = {
        valid: false,
        data: {
            name: this.collection.name,
            description: this.collection.description,
            itemName: this.collection.itemName,
        },
        rules: {
            name: [
                (value: string) => !!value || 'This field is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
            description: [
                (value: string) => !!value || 'This field is required',
                (value: string) => value.length <= 500 || 'Max 500 characters',
            ],
            itemName: [
                (value: string) => !!value || 'This field is required',
                (value: string) => value.length <= 15 || 'Max 15 characters',
            ],
        },
    }

    get collection(): CollectionDetail {
        return this.$store.state.collection.currentCollection
    }

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get isFormUntouched(): boolean {
        return (
            this.collectionForm.data.name === this.collection.name &&
            this.collectionForm.data.description === this.collection.description &&
            this.collectionForm.data.itemName === this.collection.itemName
        )
    }

    toggleCollectionArchiveState(): void {
        this.$store.dispatch(collectionActions.updateProperties, {
            id: this.collection.id,
            data: { archived: !this.collection.archived },
        })
        this.resetForm()
    }

    resetForm(): void {
        this.collectionForm.data = {
            name: this.collection.name,
            description: this.collection.description,
            itemName: this.collection.itemName,
        }
        this.form.resetValidation()
    }

    updateCollection(): void {
        this.$store.dispatch(collectionActions.updateProperties, {
            id: this.collection.id,
            data: this.collectionForm.data,
        })
    }

    deleteCollection(): void {
        collectionService
            .deleteCollection(this.collection.id)
            .then(() => {
                this.$router.push({ name: 'collection-list' })
            })
            .catch((error: any) => console.error(error))
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

@media #{map-get($display-breakpoints, 'sm-only')} {
    .item-name-wrapper {
        width: 50%;
    }
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
    .form-wrapper {
        width: 75%;
    }

    .item-name-wrapper {
        width: calc(100% / 3);
    }
}
</style>
