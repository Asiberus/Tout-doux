<template>
    <div>
        <v-card
            :color="selected ? 'green darken-2' : null"
            :disabled="selected"
            :ripple="false"
            class="wrapper rounded-lg">
            <v-icon>mdi-timeline</v-icon>
            <div class="content">
                <div class="content__body">
                    <h5 class="text-h6 white--text text-ellipsis" :title="commonTask.name">
                        {{ commonTask.name }}
                    </h5>
                </div>
                <template v-if="commonTask.tags.length > 0">
                    <TagGroup :tag-list="commonTask.tags" max-tag="3"></TagGroup>
                </template>
            </div>
            <div v-if="editable" class="actions">
                <v-menu v-model="commonTaskMenu" offset-y>
                    <template #activator="{ attrs, on }">
                        <v-btn v-bind="attrs" v-on="on" plain icon x-small>
                            <v-icon small>mdi-dots-vertical</v-icon>
                        </v-btn>
                    </template>
                    <v-list dense>
                        <v-list-item @click="openEditDialog()">
                            <v-icon small left>mdi-pencil</v-icon>
                            <v-list-item-title>Edit</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="openDeleteDialog()">
                            <v-icon small left>mdi-trash-can</v-icon>
                            <v-list-item-title>Delete</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </div>
        </v-card>

        <CommonTaskDialog
            v-model="editDialog"
            :common-task="commonTask"
            @update="emitUpdateEvent($event)">
        </CommonTaskDialog>

        <v-dialog v-model="deleteConfirmDialog" width="50%">
            <ConfirmDialog @confirm="emitDeleteEvent()" @cancel="deleteConfirmDialog = false">
                <template #icon>
                    <v-icon x-large>mdi-trash-can</v-icon>
                </template>
                <p>Are you sure to delete this common task ?</p>
            </ConfirmDialog>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import CommonTaskDialog from '@/views/components/common-task/CommonTaskDialog.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

@Component({ components: { TagGroup, CommonTaskDialog, ConfirmDialog } })
export default class CommonTaskCard extends Vue {
    @Prop({ required: true }) readonly commonTask!: CommonTask
    @Prop({ default: true }) editable!: boolean
    @Prop({ default: false }) selected!: boolean

    commonTaskMenu = false
    editDialog = false
    deleteConfirmDialog = false

    openEditDialog(): void {
        this.editDialog = true
    }

    openDeleteDialog(): void {
        this.deleteConfirmDialog = true
    }

    emitUpdateEvent(event: { id: number; data: CommonTaskForm }): void {
        this.editDialog = false
        this.$emit('update', event)
    }

    emitDeleteEvent(): void {
        this.editDialog = false
        this.$emit('delete', this.commonTask.id)
    }
}
</script>

<style scoped lang="scss">
.wrapper {
    display: flex;
    align-items: center;
    column-gap: 16px;
    padding: 12px 8px 12px 20px;
    min-height: 80px;

    .content {
        flex-grow: 1;
        min-width: 0; // default to min-width: auto for flex children. Prevent content to overflowing
        display: flex;
        flex-direction: column;
        row-gap: 4px;

        .tag-icon {
            opacity: 0.62;
            margin-right: 4px;
        }
    }

    .actions {
        position: absolute;
        top: 8px;
        right: 8px;
    }
}
</style>
