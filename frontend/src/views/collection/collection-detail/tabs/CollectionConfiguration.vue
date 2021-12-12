<template>
    <div>
        <div class="d-flex justify-space-between align-center mb-3">
            <h3>General</h3>
            <div>
                <v-dialog v-model="archiveProjectDialog" width="50%">
                    <template #activator="{ attrs, on }">
                        <v-btn
                            v-bind="attrs"
                            v-on="on"
                            :outlined="!collection.archived"
                            color="accent mr-3">
                            <v-icon small left>mdi-archive</v-icon>
                            {{ collection.archived ? 'archived' : 'archive' }}
                        </v-btn>
                    </template>
                    <ConfirmDialog
                        color="accent"
                        @confirm="toggleCollectionArchiveState"
                        @cancel="archiveProjectDialog = false">
                        <template #icon>
                            <v-icon x-large>mdi-archive</v-icon>
                        </template>
                        <p>
                            Are you sure to
                            {{ this.collection.archived ? 'unarchive' : 'archive' }} this collection
                            ?
                        </p>
                    </ConfirmDialog>
                </v-dialog>
                <template v-if="collection.archived">
                    <v-dialog v-model="deleteCollectionDialog" width="50%">
                        <template #activator="{ attrs, on }">
                            <v-btn v-bind="attrs" v-on="on" outlined color="error">
                                <v-icon small left>mdi-trash-can</v-icon>
                                delete
                            </v-btn>
                        </template>
                        <ConfirmDialog
                            color="error"
                            @confirm="deleteCollection"
                            @cancel="deleteCollectionDialog = false">
                            <template #icon>
                                <v-icon x-large>mdi-trash-can</v-icon>
                            </template>
                            <p>Are you sure to delete this collection ?</p>
                            <p class="mb-0 font-italic" style="font-size: 1.1rem">
                                All related tasks will be deleted
                            </p>
                        </ConfirmDialog>
                    </v-dialog>
                </template>
            </div>
        </div>

        <v-form v-model="collectionForm.valid" @submit.prevent="updateCollection" class="px-3">
            <v-row>
                <v-col>
                    <v-text-field
                        v-model="collectionForm.data.name"
                        :rules="collectionForm.rules.name"
                        :disabled="collection.archived"
                        label="Name"
                        counter="50"
                        maxlength="50"
                        required
                        :autofocus="!collection">
                    </v-text-field>
                </v-col>
            </v-row>
            <v-row>
                <v-col>
                    <v-textarea
                        v-model="collectionForm.data.description"
                        :rules="collectionForm.rules.description"
                        :disabled="collection.archived"
                        @keyup.enter.ctrl="updateCollection"
                        label="Description"
                        counter="500"
                        maxlength="500"
                        required
                        rows="1"
                        auto-grow>
                    </v-textarea>
                </v-col>
            </v-row>
            <div v-if="!collection.archived" class="float-right mt-5">
                <v-btn
                    color="success"
                    :disabled="!collectionForm.valid || isFormUntouched"
                    @click="updateCollection">
                    update
                </v-btn>
            </div>
        </v-form>
    </div>
</template>

<script lang="ts">
import { collectionService } from '@/api/collection.api'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { CollectionTask } from '@/models/collection.model'
import { collectionActions } from '@/store/modules/collection.store'
import { Component, Vue } from 'vue-property-decorator'

@Component({
    components: {
        ConfirmDialog,
    },
})
export default class CollectionConfiguration extends Vue {
    archiveProjectDialog = false
    deleteCollectionDialog = false
    collectionForm = {
        valid: false,
        data: {
            name: this.collection.name,
            description: this.collection.description,
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

    get collection(): CollectionTask {
        return this.$store.state.collection.currentCollection
    }

    get isFormUntouched(): boolean {
        return (
            this.collectionForm.data.name === this.collection.name &&
            this.collectionForm.data.description === this.collection.description
        )
    }

    toggleCollectionArchiveState(): void {
        this.archiveProjectDialog = false
        this.$store.dispatch(collectionActions.updateProperties, {
            id: this.collection.id,
            data: { archived: !this.collection.archived },
        })
    }

    updateCollection(): void {
        this.$store.dispatch(collectionActions.updateProperties, {
            id: this.collection.id,
            data: this.collectionForm.data,
        })
    }

    deleteCollection(): void {
        this.deleteCollectionDialog = false
        collectionService.deleteCollection(this.collection.id).then(
            () => {
                this.$router.push({ name: 'collection-list' })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }
}
</script>

<style scoped lang="scss"></style>
