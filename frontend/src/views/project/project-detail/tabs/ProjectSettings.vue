<template>
    <v-row>
        <v-col cols="2">
            <v-tabs v-model="settingsTab" vertical background-color="transparent" color="accent">
                <v-tab>
                    <v-icon left small>mdi-cog</v-icon>
                    General
                </v-tab>
                <v-tab disabled>
                    <v-icon left small>mdi-account</v-icon>
                    User
                </v-tab>
            </v-tabs>
        </v-col>
        <v-col>
            <v-tabs-items v-model="settingsTab" class="transparent">
                <v-tab-item :transition="false">
                    <div class="d-flex align-center mb-3">
                        <h4 class="text-h4 flex-grow-1">General</h4>
                        <v-dialog v-model="archiveProjectDialog" width="50%">
                            <template #activator="{ attrs, on }">
                                <v-btn
                                    v-bind="attrs"
                                    v-on="on"
                                    :outlined="!project.archived"
                                    color="accent mr-3">
                                    <v-icon small left>mdi-archive</v-icon>
                                    {{ project.archived ? 'archived' : 'archive' }}
                                </v-btn>
                            </template>
                            <ConfirmDialog
                                color="accent"
                                @confirm="toggleProjectArchiveState()"
                                @cancel="archiveProjectDialog = false">
                                <template #icon>
                                    <v-icon x-large>mdi-archive</v-icon>
                                </template>
                                <p>
                                    Are you sure to
                                    {{ this.project.archived ? 'unarchive' : 'archive' }} this
                                    project ?
                                </p>
                            </ConfirmDialog>
                        </v-dialog>
                        <template v-if="project.archived">
                            <v-dialog v-model="deleteProjectDialog" width="50%">
                                <template #activator="{ attrs, on }">
                                    <v-btn v-bind="attrs" v-on="on" color="error">
                                        <v-icon small left>mdi-trash-can</v-icon>
                                        delete
                                    </v-btn>
                                </template>
                                <ConfirmDialog
                                    color="error"
                                    @confirm="deleteProject()"
                                    @cancel="deleteProjectDialog = false">
                                    <template #icon>
                                        <v-icon x-large>mdi-trash-can</v-icon>
                                    </template>
                                    <p>Are you sure to delete this project ?</p>
                                    <p class="mb-0 font-italic" style="font-size: 1.1rem">
                                        All related tasks will be deleted
                                    </p>
                                </ConfirmDialog>
                            </v-dialog>
                        </template>
                    </div>
                    <v-row>
                        <v-col cols="10">
                            <v-form v-model="projectForm.valid" @submit.prevent="updateProject()">
                                <v-text-field
                                    v-model="projectForm.data.name"
                                    :rules="projectForm.rules.name"
                                    :disabled="project.archived"
                                    label="Name"
                                    counter="50"
                                    maxlength="50"
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
                                    maxlength="500"
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
                                    <v-icon
                                        small
                                        :color="
                                            this.project.archived
                                                ? 'grey darken-2'
                                                : 'grey lighten-2'
                                        ">
                                        mdi-tag
                                    </v-icon>
                                    Tags
                                </h6>
                                <TagSearch
                                    :selected-tags.sync="tagList"
                                    :disabled="project.archived"
                                    type="project"
                                    class="mb-5">
                                </TagSearch>

                                <div class="tag-wrapper mb-3">
                                    <TagChip
                                        v-for="tag of tagList"
                                        :key="tag.id"
                                        :tag="tag"
                                        :disabled="project.archived"
                                        :clearable="true"
                                        @clear="removeTag($event)">
                                    </TagChip>
                                </div>

                                <div v-if="!project.archived" class="float-right">
                                    <v-btn
                                        color="success"
                                        type="submit"
                                        :disabled="!projectForm.valid || isFormUntouched">
                                        update
                                    </v-btn>
                                </div>
                            </v-form>
                        </v-col>
                    </v-row>
                </v-tab-item>
                <v-tab-item :transition="false" />
            </v-tabs-items>
        </v-col>
    </v-row>
</template>

<script lang="ts">
import { projectService } from '@/api/project.api'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { ProjectDetail, ProjectPostOrPatch } from '@/models/project.model'
import { projectActions } from '@/store/modules/project.store'
import { Component, Vue, Watch } from 'vue-property-decorator'
import TagSearch from '@/views/components/tag/TagSearch.vue'
import TagChip from '@/views/components/tag/TagChip.vue'
import { Tag } from '@/models/tag.model'
import { Form } from '@/models/common.model'
import deepEqual from 'deep-equal'

@Component({ components: { TagSearch, TagChip, ConfirmDialog } })
export default class ProjectSettings extends Vue {
    settingsTab = 0
    archiveProjectDialog = false
    deleteProjectDialog = false

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
        this.archiveProjectDialog = false
        this.$store.dispatch(projectActions.updateProperties, {
            id: this.project.id,
            data: { archived: !this.project.archived },
        })
    }

    updateProject(): void {
        this.$store.dispatch(projectActions.updateProperties, {
            id: this.project.id,
            data: this.projectForm.data,
        })
    }

    deleteProject(): void {
        this.deleteProjectDialog = false
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
.tag-wrapper {
    min-height: 32px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
</style>
