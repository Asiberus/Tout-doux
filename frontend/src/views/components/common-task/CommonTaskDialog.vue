<template>
    <v-dialog
        :value="value"
        @input="$emit('input', $event)"
        :width="getDialogWidth()"
        :fullscreen="$vuetify.breakpoint.smAndDown">
        <template #activator="{ attrs, on }">
            <slot name="activator" :attrs="attrs" :on="on"></slot>
        </template>
        <v-card class="d-flex flex-column">
            <div class="px-6 pt-4 pb-2">
                <h4 class="text-h5 text-sm-h4">{{ title }}</h4>
            </div>
            <v-card-text class="flex-grow-1 d-flex flex-column">
                <v-form
                    ref="form"
                    v-model="commonTaskForm.valid"
                    @submit.prevent="emitSubmit()"
                    class="flex-grow-1 d-flex flex-column">
                    <v-text-field
                        ref="name"
                        v-model="commonTaskForm.data.name"
                        @input="validateName"
                        label="Name"
                        counter="50"
                        requried
                        :loading="inputNameLoading"
                        :rules="commonTaskForm.rules.name"
                        :error-messages="nameUniqueError"
                        :autofocus="!commonTask"
                        class="flex-grow-0 mb-2">
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

                    <v-spacer></v-spacer>

                    <div class="d-flex justify-end gap-2">
                        <v-btn
                            color="success"
                            text
                            type="submit"
                            :disabled="!commonTaskForm.valid || commonTaskForm.pending"
                            class="flex-grow-1 flex-md-grow-0">
                            {{ commonTask ? 'update' : 'create' }}
                        </v-btn>
                        <v-btn @click="closeDialog()" plain class="flex-grow-1 flex-md-grow-0">
                            cancel
                        </v-btn>
                    </div>
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
import { getDialogWidth } from '@/utils/dialog.utils'

@Component({
    methods: { getDialogWidth },
    components: { TagSearch, TagChip },
})
export default class CommonTaskDialog extends Vue {
    @Prop({ required: true }) value!: boolean
    @Prop({ required: false }) commonTask?: CommonTask

    nameUniqueError: string | null = null
    inputNameLoading = false
    validationTimer?: number = undefined

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
                this.nameUniqueError = null
                this.form.resetValidation()
                this.populateForm()
                if (!this.commonTask) this.inputName.focus()
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

        if (value === '') {
            this.nameUniqueError = null
            return
        }

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

    closeDialog(): void {
        this.$emit('input', false)
    }
}
</script>

<style scoped lang="scss">
.tag-wrapper {
    min-height: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
</style>
