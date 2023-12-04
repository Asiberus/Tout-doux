<template>
    <v-card class="d-flex flex-column">
        <div class="px-6 pt-4 pb-2">
            <h4 class="text-h5 text-sm-h4">New project</h4>
        </div>
        <v-card-text class="flex-grow-1 d-flex flex-column">
            <v-form
                ref="form"
                v-model="projectForm.valid"
                @submit.prevent="emitSubmitEvent()"
                class="flex-grow-1 d-flex flex-column">
                <div class="inputs-wrapper">
                    <v-text-field
                        ref="name"
                        v-model="projectForm.data.name"
                        :rules="projectForm.rules.name"
                        label="Name"
                        counter="50"
                        required
                        autofocus
                        class="mb-2">
                    </v-text-field>
                    <v-textarea
                        v-model="projectForm.data.description"
                        :rules="projectForm.rules.description"
                        @keyup.enter.ctrl="emitSubmitEvent()"
                        label="Description"
                        counter="500"
                        required
                        rows="1"
                        auto-grow
                        class="mb-2">
                    </v-textarea>

                    <h6 class="text-h6 grey--text text--lighten-2">
                        <v-icon small>mdi-tag</v-icon>
                        Tags
                    </h6>
                    <TagSearch
                        :selected-tags.sync="tagList"
                        type="project"
                        class="mb-5"></TagSearch>

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
                        :disabled="!projectForm.valid"
                        class="flex-grow-1 flex-md-grow-0">
                        create
                    </v-btn>
                    <v-btn plain @click="emitCloseEvent()" class="flex-grow-1 flex-md-grow-0"
                        >cancel</v-btn
                    >
                </div>
            </v-form>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import TagChip from '@/views/components/tag/TagChip.vue'
import { Tag } from '@/models/tag.model'
import { Form } from '@/models/common.model'
import { ProjectPostOrPatch } from '@/models/project.model'

@Component({ components: { TagSearch, TagChip } })
export default class ProjectFormDialog extends Vue {
    @Prop() isDialogOpen!: boolean

    tagList: Tag[] = []
    projectForm: Form<ProjectPostOrPatch> = {
        valid: false,
        data: {
            name: '',
            description: '',
            tagIds: [],
        },
        rules: {
            name: [
                (value: string) => !!value || 'Project name is required',
                (value: string) => value.length <= 50 || 'Max 50 characters',
            ],
            description: [
                (value: string) => !!value || 'Project description is required',
                (value: string) => value.length <= 500 || 'Max 500 characters',
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

        this.projectForm.data = { name: '', description: '', tagIds: [] }
        this.tagList = []
        this.form.resetValidation()
        this.inputName.focus()
    }

    @Watch('tagList')
    private onTagListChanges(value: Tag[]): void {
        this.projectForm.data.tagIds = value.map(({ id }) => id)
    }

    removeTag(id: number): void {
        this.tagList = this.tagList.filter(tag => tag.id !== id)
    }

    emitSubmitEvent(): void {
        if (!this.projectForm.valid) return

        this.$emit('submit', this.projectForm.data)
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
