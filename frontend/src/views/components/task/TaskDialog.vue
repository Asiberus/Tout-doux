<template>
    <v-card class="d-flex flex-column">
        <div class="px-6 pt-4 pb-2">
            <h4 class="text-h5 text-sm-h4">{{ task ? 'Update' : 'New' }} {{ itemName }}</h4>
        </div>
        <v-card-text class="flex-grow-1 d-flex flex-column">
            <v-form
                ref="form"
                v-model="taskForm.valid"
                @submit.prevent="emitSubmitEvent()"
                class="flex-grow-1 d-flex flex-column">
                <div class="inputs-wrapper">
                    <v-text-field
                        ref="name"
                        v-model="taskForm.data.name"
                        label="Name"
                        counter="50"
                        requried
                        :rules="taskForm.rules.name"
                        autofocus
                        class="mb-2">
                    </v-text-field>

                    <h6 class="text-h6 grey--text text--lighten-2">
                        <v-icon small>mdi-tag</v-icon>
                        Tags
                    </h6>
                    <TagSearch :selected-tags.sync="tagList" type="task" class="mb-5"></TagSearch>

                    <div class="tag-wrapper mb-3">
                        <TagChip
                            v-for="tag of tagList"
                            :key="tag.id"
                            :tag="tag"
                            clearable
                            @clear="removeTag($event)">
                        </TagChip>
                    </div>
                </div>

                <div class="d-flex justify-end gap-2">
                    <v-btn
                        color="success"
                        text
                        type="submit"
                        :disabled="!taskForm.valid"
                        class="flex-grow-1 flex-md-grow-0">
                        {{ task ? 'update' : 'create' }}
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
import { Task, TaskPatch, TaskPost } from '@/models/task.model'
import { Form } from '@/models/common.model'
import { Tag } from '@/models/tag.model'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import TagChip from '@/views/components/tag/TagChip.vue'

@Component({ components: { TagSearch, TagChip } })
export default class TaskDialog extends Vue {
    @Prop() task?: Task
    @Prop({ required: true }) isDialogOpen!: boolean
    @Prop({ default: 'task' }) itemName!: string

    tagList: Tag[] = []
    taskForm: Form<TaskPost | TaskPatch> = {
        valid: false,
        data: {
            name: '',
            tagIds: [],
        },
        rules: {
            name: [
                (value: string) => !!value || 'Task name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
        },
    }

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get inputName(): Vue & { focus: () => void } {
        return this.$refs.name as Vue & { focus: () => void }
    }

    beforeMount(): void {
        if (this.task) this.populateForm(this.task)
    }

    @Watch('isDialogOpen')
    private onIsDialogOpenChanges(value: boolean): void {
        if (value) {
            this.populateForm(this.task)
            this.form.resetValidation()
            this.inputName.focus()
        }
    }

    @Watch('tagList')
    private onTagListChanges(value: Tag[]): void {
        this.taskForm.data.tagIds = value.map(({ id }) => id)
    }

    private populateForm(task?: Task): void {
        if (task) {
            this.taskForm.data.name = task.name
            this.taskForm.data.tagIds = task.tags.map(({ id }) => id)
            this.tagList = [...task.tags]
        } else {
            this.taskForm.data.name = ''
            this.taskForm.data.tagIds = []
            this.tagList = []
        }
    }

    removeTag(id: number): void {
        this.tagList = this.tagList.filter(tag => tag.id !== id)
    }

    emitSubmitEvent(): void {
        if (!this.taskForm.valid) return

        if (this.task) this.$emit('update', this.taskForm.data)
        else this.$emit('create', this.taskForm.data)
        // Todo : to delete
        this.$emit('submit', this.taskForm.data)
    }

    emitCloseEvent(): void {
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

.tag-wrapper {
    min-height: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
</style>
