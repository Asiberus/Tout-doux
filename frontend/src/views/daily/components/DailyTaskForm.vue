<template>
    <v-form v-model="dailyTaskForm.valid" @submit.prevent="submit()">
        <div class="d-flex align-center gap-2">
            <DailyTaskActionChip
                :action.sync="dailyTaskForm.data.action"
                :editable="true"
                class="mb-4">
            </DailyTaskActionChip>
            <v-text-field
                v-model="dailyTaskForm.data.name"
                :rules="dailyTaskForm.rules.name"
                label="Name"
                counter="50"
                maxlength="50"
                required
                autofocus
                class="mb-2">
            </v-text-field>
        </div>

        <TagSearch :selected-tags.sync="tagList" type="task" class="mb-5"></TagSearch>
        <div class="tag-wrapper mb-2">
            <TagChip
                v-for="tag of tagList"
                :key="tag.id"
                :tag="tag"
                clearable
                @clear="removeTag($event)">
            </TagChip>
        </div>

        <v-card-actions class="justify-end">
            <v-btn color="success" text small :disabled="!dailyTaskForm.valid" type="submit">
                {{ dailyTask ? 'update' : 'create' }}
            </v-btn>
            <v-btn plain small @click="close()">cancel</v-btn>
        </v-card-actions>
    </v-form>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { Tag } from '@/models/tag.model'
import { Form } from '@/models/common.model'
import { DailyTask, DailyTaskPatch } from '@/models/daily-task.model'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import TagChip from '@/views/components/tag/TagChip.vue'
import DailyTaskActionChip from '@/views/daily/components/DailyTaskActionChip.vue'

@Component({
    components: { DailyTaskActionChip, TagChip, TagSearch },
})
export default class DailyTaskForm extends Vue {
    @Prop() dailyTask?: DailyTask

    tagList: Tag[] = []
    dailyTaskForm: Form<DailyTaskPatch> = {
        valid: false,
        data: {
            action: null,
            name: '',
            tagIds: [],
        },
        rules: {
            name: [
                (value: string) => !!value || 'Name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
        },
    }

    beforeMount(): void {
        if (this.dailyTask) {
            this.dailyTaskForm.data = {
                action: this.dailyTask.action,
                name: this.dailyTask.name,
                tagIds: this.dailyTask.tags.map(({ id }) => id),
            }
            this.tagList = this.dailyTask.tags
        }
    }

    @Watch('tagList')
    private onTagListChanges(value: Tag[]): void {
        this.dailyTaskForm.data.tagIds = value.map(({ id }) => id)
    }

    submit(): void {
        this.$emit('submit', this.dailyTaskForm.data)
    }

    close(): void {
        this.$emit('close')
    }

    removeTag(id: number): void {
        this.tagList = this.tagList.filter(tag => tag.id !== id)
    }
}
</script>

<style scoped lang="scss">
.tag-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
</style>
