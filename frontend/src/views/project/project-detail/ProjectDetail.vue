<template>
    <div v-if="project">
        <div class="d-flex flex-column flex-sm-row align-center gap-2">
            <v-icon v-if="$vuetify.breakpoint.xsOnly">mdi-briefcase-variant</v-icon>
            <SecondaryTitle class="text-center text-sm-start">
                <span v-if="$vuetify.breakpoint.smAndUp" class="grey--text">Project : </span>
                {{ project.name }}
            </SecondaryTitle>
            <v-chip v-if="project.archived" color="accent" class="flex-shrink-0">
                <v-icon small class="mr-1"> mdi-archive </v-icon>
                Archived
            </v-chip>
        </div>

        <v-divider class="my-4" />

        <v-tabs background-color="transparent" color="accent" class="mb-3" show-arrows>
            <v-tab :to="{ name: 'project-detail' }" exact>Description</v-tab>
            <v-tab :to="{ name: 'project-detail-section' }">Section</v-tab>
            <v-tab :to="{ name: 'project-detail-event' }">Event</v-tab>
            <v-tab disabled>Historic</v-tab>
            <v-tab :to="{ name: 'project-detail-settings' }">Settings</v-tab>
        </v-tabs>

        <router-view />
    </div>
</template>

<script lang="ts">
import { ProjectDetail } from '@/models/project.model'
import { projectActions } from '@/store/modules/project.store'
import { Component, Prop, Vue } from 'vue-property-decorator'
import SecondaryTitle from '@/components/SecondaryTitle.vue'

@Component({ components: { SecondaryTitle } })
export default class ProjectDetailComponent extends Vue {
    @Prop() private projectId!: number

    get project(): ProjectDetail | undefined {
        return this.$store.state.project.currentProject
    }

    mounted(): void {
        this.$store.dispatch(projectActions.retrieveProject, this.projectId)
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.v-tabs::v-deep {
    .v-slide-group__prev,
    .v-slide-group__next {
        min-width: initial;
    }
}

@media #{map-get($display-breakpoints, 'xs-only')} {
    .v-tabs::v-deep .v-tab {
        font-size: 0.7rem;
        padding: 0 8px;
    }
}
</style>
