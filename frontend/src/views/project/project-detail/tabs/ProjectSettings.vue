<template>
    <div>
        <div class="d-flex flex-column flex-sm-row align-stretch column-gap-2 row-gap-1 mb-3">
            <h4 class="text-h6 text-sm-h5 flex-grow-1">Settings</h4>

            <div class="d-flex gap-2">
                <ConfirmDialog @confirm="toggleProjectArchiveState()">
                    <template #activator="{ attrs, on }">
                        <v-btn
                            v-bind="attrs"
                            v-on="on"
                            :outlined="!project.archived"
                            :small="$vuetify.breakpoint.xsOnly"
                            color="accent"
                            class="flex-grow-1 flex-sm-grow-0">
                            <v-icon small left>mdi-archive</v-icon>
                            {{ project.archived ? 'unarchive' : 'archive' }}
                        </v-btn>
                    </template>
                    <template #icon>
                        <v-icon x-large>mdi-archive</v-icon>
                    </template>
                    <span>
                        Are you sure to
                        {{ this.project.archived ? 'unarchive' : 'archive' }} this project ?
                    </span>
                </ConfirmDialog>
                <template v-if="project.archived">
                    <ConfirmDialog @confirm="deleteProject()">
                        <template #activator="{ attrs, on }">
                            <v-btn
                                v-bind="attrs"
                                v-on="on"
                                outlined
                                :small="$vuetify.breakpoint.xsOnly"
                                color="error"
                                class="flex-grow-1 flex-sm-grow-0">
                                <v-icon small left>mdi-trash-can</v-icon>
                                delete
                            </v-btn>
                        </template>
                        <template #icon>
                            <v-icon x-large>mdi-trash-can</v-icon>
                        </template>
                        <p class="mb-1">Are you sure to delete this project ?</p>
                        <p class="mb-0 font-italic" style="font-size: 1.1rem">
                            All related tasks will be deleted
                        </p>
                    </ConfirmDialog>
                </template>
            </div>
        </div>

        <v-form
            ref="form"
            v-model="projectForm.valid"
            @submit.prevent="updateProject()"
            class="form-wrapper">
            <v-text-field
                v-model="projectForm.data.name"
                :rules="projectForm.rules.name"
                :disabled="project.archived"
                label="Name"
                counter="50"
                required
                class="mb-2">
            </v-text-field>
            <v-textarea
                v-model="projectForm.data.description"
                :rules="projectForm.rules.description"
                :disabled="project.archived"
                @keyup.enter.ctrl="updateProject()"
                label="Description"
                counter="500"
                required
                rows="2"
                auto-grow
                class="mb-2">
            </v-textarea>

            <h6
                class="text-h6 grey--text"
                :class="{
                    'text--lighten-2': !this.project.archived,
                    'text--darken-2': this.project.archived,
                }">
                <v-icon small :color="this.project.archived ? 'grey darken-2' : 'grey lighten-2'">
                    mdi-tag
                </v-icon>
                Tags
            </h6>
            <TagSearch
                :selected-tags.sync="tagList"
                :disabled="project.archived"
                type="project"
                class="mb-3">
            </TagSearch>

            <div class="tag-wrapper" v-if="tagList.length > 0">
                <TagChip
                    v-for="tag of tagList"
                    :key="tag.id"
                    :tag="tag"
                    :disabled="project.archived"
                    :clearable="true"
                    @clear="removeTag($event)">
                </TagChip>
            </div>

            <div v-if="!project.archived" class="d-flex justify-end mb-5">
                <v-btn
                    color="success"
                    type="submit"
                    :block="$vuetify.breakpoint.xsOnly"
                    :disabled="!projectForm.valid || isFormUntouched">
                    update
                </v-btn>
            </div>
        </v-form>
    </div>
</template>

<script lang="ts">
import { projectService } from '@/api/project.api'
import { ProjectDetail, ProjectPostOrPatch } from '@/models/project.model'
import { projectActions } from '@/store/modules/project.store'
import { Component, Vue, Watch } from 'vue-property-decorator'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import TagChip from '@/views/components/tag/TagChip.vue'
import { Tag } from '@/models/tag.model'
import { Form } from '@/models/common.model'
import deepEqual from 'deep-equal'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

@Component({ components: { TagSearch, TagChip, ConfirmDialog } })
export default class ProjectSettings extends Vue {
    tagList: Tag[] = []

    projectForm: Form<ProjectPostOrPatch> = {
        valid: false,
        data: {
            name: this.project.name,
            description: this.project.description,
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

    get project(): ProjectDetail {
        return this.$store.state.project.currentProject
    }

    get isFormUntouched(): boolean {
        return (
            this.projectForm.data.name === this.project.name &&
            this.projectForm.data.description === this.project.description &&
            deepEqual(
                this.projectForm.data.tagIds,
                this.project.tags.map(({ id }) => id)
            )
        )
    }

    get form(): Vue & { resetValidation: () => void } {
        return this.$refs.form as Vue & { resetValidation: () => void }
    }

    @Watch('project.tags', { deep: true, immediate: true })
    private onProjectTagsChanges(value: Tag[]): void {
        this.tagList = value
    }

    @Watch('tagList', { immediate: true })
    private onTagListChanges(value: Tag[]): void {
        this.projectForm.data.tagIds = value.map(({ id }) => id)
    }

    removeTag(id: number): void {
        this.tagList = this.tagList.filter(tag => tag.id !== id)
    }

    toggleProjectArchiveState(): void {
        this.$store.dispatch(projectActions.updateProperties, {
            id: this.project.id,
            data: { archived: !this.project.archived },
        })
        this.resetForm()
    }

    resetForm(): void {
        this.projectForm.data = {
            name: this.project.name,
            description: this.project.description,
            tagIds: [],
        }
        this.form.resetValidation()
    }

    updateProject(): void {
        this.$store.dispatch(projectActions.updateProperties, {
            id: this.project.id,
            data: this.projectForm.data,
        })
    }

    deleteProject(): void {
        projectService.deleteProject(this.project.id).then(
            () => {
                this.$router.push({ name: 'project-list' })
            },
            (error: any) => {
                console.error(error)
            }
        )
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

@media #{map-get($display-breakpoints, 'md-and-up')} {
    .form-wrapper {
        width: 75%;
    }
}

.tag-wrapper {
    min-height: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
}
</style>
