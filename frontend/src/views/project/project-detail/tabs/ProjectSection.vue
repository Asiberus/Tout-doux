<template>
    <div class="flex-grow-1 d-flex flex-column">
        <template v-if="sections.length > 0">
            <v-tabs
                v-model="sectionTabs"
                @change="changeRouteParam($event)"
                color="accent"
                hide-slider
                show-arrows
                background-color="transparent"
                class="mb-2 flex-grow-0">
                <v-tab v-for="section of sections" :key="'tab-' + section.id">
                    <span class="text-truncate">{{ section.name }}</span>

                    <ProgressDisk
                        v-if="section.tasks.length > 0"
                        :value="section.tasks.filter(({ completed }) => completed).length"
                        :max="section.tasks.length"
                        color="green accent-2"
                        class="ml-1 flex-shrink-0"
                        :title="`${section.tasks.filter(({ completed }) => completed).length} of ${
                            section.tasks.length
                        } tasks completed`">
                    </ProgressDisk>
                </v-tab>
            </v-tabs>

            <v-tabs-items v-model="sectionTabs" class="transparent">
                <v-tab-item v-for="section of sections" :key="'tab-item-' + section.id">
                    <ProjectSectionItem
                        :section="section"
                        :disabled="project.archived"
                        @new-section="sectionDialog = true">
                    </ProjectSectionItem>
                </v-tab-item>
            </v-tabs-items>
        </template>
        <template v-else>
            <EmptyListDisplay class="empty-list-display">
                <template #img>
                    <img
                        src="../../../../assets/project_section.svg"
                        alt="No sections"
                        width="200"
                        class="empty-list-display__img" />
                </template>
                <template #message>
                    <div class="mb-2">This project has no section yet!</div>
                    <v-btn
                        v-if="!project.archived"
                        @click="sectionDialog = true"
                        :small="$vuetify.breakpoint.smAndDown">
                        <v-icon left small>mdi-plus</v-icon>
                        add a section
                    </v-btn>
                </template>
            </EmptyListDisplay>
        </template>

        <v-dialog
            v-model="sectionDialog"
            :width="getDialogWidth()"
            :fullscreen="$vuetify.breakpoint.smAndDown">
            <SectionDialog
                :is-dialog-open="sectionDialog"
                @submit="createSection($event)"
                @close="sectionDialog = false">
            </SectionDialog>
        </v-dialog>
    </div>
</template>

<script lang="ts">
import EmptyListDisplay from '@/components/EmptyListDisplay.vue'
import { ProjectDetail } from '@/models/project.model'
import { SectionTask } from '@/models/section.model'
import { projectActions } from '@/store/modules/project.store'
import ProjectSectionItem from '@/views/project/project-detail/components/ProjectSectionItem.vue'
import SectionDialog from '@/views/project/project-detail/components/SectionDialog.vue'
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import ProgressDisk from '@/components/ProgressDisk.vue'
import { getDialogWidth } from '@/utils/dialog.utils'

@Component({
    methods: { getDialogWidth },
    components: {
        ProgressDisk,
        ProjectSectionItem,
        SectionDialog,
        EmptyListDisplay,
    },
})
export default class ProjectSection extends Vue {
    @Prop({ default: 0 }) sectionId!: number

    sectionDialog = false
    sectionTabs = 0

    get project(): ProjectDetail {
        return this.$store.state.project.currentProject
    }

    get sections(): SectionTask[] {
        return this.project.sections
    }

    @Watch('sectionId', { immediate: true })
    onSectionIdChanges(value: number): void {
        this.sectionTabs = this.sections.findIndex(({ id }) => id === value) ?? 0
    }

    createSection(data: { name: string }): void {
        this.sectionDialog = false
        this.$store
            .dispatch(projectActions.section.addSection, {
                name: data.name,
                projectId: this.project.id,
            })
            .then(() => {
                this.sectionTabs = this.sections.length - 1
            })
    }

    changeRouteParam(index: number): void {
        this.$router.replace({
            params: { ...this.$route.params, sectionId: `${this.sections[index].id}` },
        })
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.v-tab {
    max-width: 300px;
}

.v-tabs::v-deep {
    .v-slide-group__prev,
    .v-slide-group__next {
        min-width: initial;
        flex: 0 1 auto;
    }
}

@media #{map-get($display-breakpoints, 'xs-only')} {
    .v-tab {
        max-width: 150px;
        font-size: 0.7rem;
        padding: 0 8px;
    }
}

.empty-list-display {
    padding-top: 20px;
    flex-grow: 1;

    &__img {
        width: clamp(200px, 50%, 300px);

        @media #{map-get($display-breakpoints, 'xl-only')} {
            width: clamp(200px, 50%, 400px);
        }
    }
}
</style>
