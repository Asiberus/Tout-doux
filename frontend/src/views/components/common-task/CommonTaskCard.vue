<template>
    <div>
        <v-card @click="commonTaskDialog = true">
            <v-card-text class="d-flex align-center">
                <div class="pl-3">
                    <h5 class="text-h5 white--text">{{ commonTask.name }}</h5>
                    <v-chip-group class="tags-wrapper">
                        <TagChip v-for="tag of commonTask.tags" :tag="tag" :small="true"></TagChip>
                    </v-chip-group>
                </div>
            </v-card-text>
        </v-card>

        <CommonTaskDialog
            v-model="commonTaskDialog"
            :common-task="commonTask"
            @update="emitUpdateEvent($event)"
            @delete="emitDeleteEvent()">
        </CommonTaskDialog>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import TagChip from '@/components/TagChip.vue'
import CommonTaskDialog from '@/views/components/common-task/CommonTaskDialog.vue'

@Component({ components: { TagChip, CommonTaskDialog } })
export default class CommonTaskCard extends Vue {
    @Prop({ required: true }) readonly commonTask!: CommonTask

    commonTaskDialog = false

    emitUpdateEvent(event: { id: number; data: CommonTaskForm }): void {
        this.commonTaskDialog = false
        this.$emit('update', event)
    }

    emitDeleteEvent(): void {
        this.commonTaskDialog = false
        this.$emit('delete', this.commonTask.id)
    }
}
</script>

<style scoped lang="scss">
.tags-wrapper {
    // height of chip + chip margin + padding of chip group
    min-height: calc(24px + 8px + 8px);
}
</style>
