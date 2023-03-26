<template>
    <v-dialog :value="value" @input="$emit('input', $event)" width="60%">
        <template #activator="{ attrs, on }">
            <slot name="activator" :attrs="attrs" :on="on"></slot>
        </template>
        <v-card>
            <v-card-title class="d-flex justify-space-between align-center mb-3">
                <h2>{{ title }}</h2>
                <div v-if="commonTask">
                    <v-hover v-slot="{ hover }">
                        <v-btn
                            @click="emitDelete()"
                            :color="hover || confirmDelete ? 'error' : null">
                            {{ confirmDelete ? 'Are you sure ?' : 'Delete Tag' }}
                        </v-btn>
                    </v-hover>
                </div>
            </v-card-title>
            <v-card-text>
                <v-form ref="form" v-model="commonTaskForm.valid" @submit.prevent="emitSubmit()">
                    <v-text-field
                        ref="name"
                        v-model="commonTaskForm.data.name"
                        @input="validateName"
                        label="Name"
                        counter="50"
                        maxlength="50"
                        requried
                        :loading="inputNameLoading"
                        :rules="commonTaskForm.rules.name"
                        :error-messages="nameUniqueError"
                        autofocus
                        class="mb-2">
                    </v-text-field>

                    <h6 class="text-h6 grey--text text--lighten-2">
                        <v-icon small>mdi-tag</v-icon>
                        Tags
                    </h6>
                    <TagSearch :selected-tags.sync="tagList" type="task" class="mb-5"></TagSearch>

                    <TagChip
                        v-for="tag of tagList"
                        :key="tag.id"
                        :tag="tag"
                        clearable
                        @clear="removeTag($event)"
                        class="mr-2 mb-2">
                    </TagChip>

                    <v-card-actions class="d-flex justify-end mt-3">
                        <v-btn
                            color="success"
                            text
                            type="submit"
                            :disabled="!commonTaskForm.valid || commonTaskForm.pending">
                            {{ commonTask ? 'update' : 'create' }}
                        </v-btn>
                        <v-btn plain class="ml-2" @click="closeDialog()">cancel</v-btn>
                    </v-card-actions>
                </v-form>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { CommonTask, CommonTaskForm } from '@/models/common-task.model'
import { Form } from '@/models/common.model'
import { commonTaskService } from '@/api'
import { IsCommonTaskNameUniqueParams } from '@/api/common-task.api'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import { Tag } from '@/models/tag.model'
import TagChip from '@/views/components/tag/TagChip.vue'

@Component({ components: { TagSearch, TagChip } })
export default class CommonTaskDialog extends Vue {
    @Prop({ required: true }) value!: boolean
    @Prop({ required: false }) commonTask?: CommonTask

    confirmDelete = false
    nameUniqueError: string | null = null
    inputNameLoading = false
    validationTimer?: number

    tagList: Tag[] = []
    commonTaskForm: Form<CommonTaskForm> = {
        valid: false,
        pending: false,
        data: {
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

    get title(): string {
        return this.commonTask ? 'Update Common Task' : 'New Common Task'
    }

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    get inputName(): Vue & { focus: () => void } {
        return this.$refs.name as Vue & { focus: () => void }
    }

    @Watch('value')
    private onDialogOpening(value: boolean): void {
        if (value) {
            // We need to wait for next tick to access the form and the input name
            this.$nextTick(() => {
                this.confirmDelete = false
                this.nameUniqueError = null
                this.form.resetValidation()
                this.inputName.focus()
                this.populateForm()
            })
        }
    }

    @Watch('tagList')
    private onTagListChanges(value: Tag[]): void {
        this.commonTaskForm.data.tagIds = value.map(({ id }) => id)
    }

    private populateForm(): void {
        if (this.commonTask) {
            this.commonTaskForm.data.name = this.commonTask.name
            this.commonTaskForm.data.tagIds = this.commonTask.tags.map(({ id }) => id)
            this.tagList = [...this.commonTask.tags]
        } else {
            this.commonTaskForm.data.name = ''
            this.commonTaskForm.data.tagIds = []
            this.tagList = []
        }
    }

    validateName(value: string): void {
        clearTimeout(this.validationTimer)

        if (value === '') return

        this.commonTaskForm.pending = true
        this.validationTimer = setTimeout(() => this.isNameUnique(value), 300)
    }

    private isNameUnique(name: string): void {
        const params: IsCommonTaskNameUniqueParams = { name, exclude_id: this.commonTask?.id }

        this.inputNameLoading = true
        commonTaskService
            .isNameUnique(params)
            .then((response: any) => {
                this.nameUniqueError = !response.body.unique
                    ? 'A common task with that name already exist'
                    : null
            })
            .catch((error: any) => console.error(error))
            .finally(() => {
                this.inputNameLoading = false
                this.commonTaskForm.pending = false
            })
    }

    removeTag(id: number): void {
        this.tagList = this.tagList.filter(tag => tag.id !== id)
    }

    emitSubmit(): void {
        const { data, valid, pending } = this.commonTaskForm
        if (!valid || pending) return

        if (this.commonTask) this.$emit('update', { id: this.commonTask.id, data })
        else this.$emit('create', data)
    }

    emitDelete(): void {
        if (!this.confirmDelete) {
            this.confirmDelete = true
            return
        }

        if (this.commonTask) this.$emit('delete', this.commonTask.id)
    }

    closeDialog(): void {
        this.$emit('input', false)
    }
}
</script>
