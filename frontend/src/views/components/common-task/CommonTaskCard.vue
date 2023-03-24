<template>
    <div class="fill-height">
        <v-card @click="commonTaskDialog = true" :ripple="false" class="fill-height">
            <v-card-text class="wrapper px-5">
                <v-icon>mdi-timeline</v-icon>

                <div class="content">
                    <h5 class="text-h5 white--text ml-3 text-ellipsis">
                        {{ commonTask.name }}
                    </h5>
                    <TagGroup v-if="commonTask.tags.length > 0" :tag-list="commonTask.tags">
                    </TagGroup>
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
import TagChip from '@/views/components/tag/TagChip.vue'
import CommonTaskDialog from '@/views/components/common-task/CommonTaskDialog.vue'
import TagGroup from '@/views/components/tag/TagGroup.vue'

@Component({ components: { TagGroup, CommonTaskDialog } })
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
.wrapper {
    min-height: 96px;
    display: flex;
    align-items: center;
    column-gap: 4px;

    .content {
        min-width: 0; // default to min-width: auto for flex children. Prevent content to overflowing
        display: flex;
        flex-direction: column;
        row-gap: 4px;
    }
}
</style>
