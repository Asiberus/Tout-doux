<template>
    <div class="fill-height d-flex flex-column">
        <MainTitle class="mb-2 mb-md-6">Settings</MainTitle>

        <v-row :no-gutters="$vuetify.breakpoint.smAndDown" class="flex-column flex-md-row">
            <v-col
                :cols="$vuetify.breakpoint.smAndDown ? null : 2"
                class="flex-grow-0 flex-md-grow-1">
                <v-tabs
                    :vertical="$vuetify.breakpoint.mdAndUp"
                    color="accent"
                    show-arrows
                    background-color="transparent">
                    <v-tab :to="{ name: 'settings-preferences' }" exact class="justify-start">
                        <v-icon left small>mdi-cog</v-icon>
                        Preferences
                    </v-tab>
                    <v-tab :to="{ name: 'settings-common-tasks' }" exact class="justify-start">
                        <v-icon left small>mdi-timeline</v-icon>
                        Common Tasks
                    </v-tab>
                    <v-tab :to="{ name: 'settings-tags' }" exact class="justify-start">
                        <v-icon left small>mdi-tag</v-icon>
                        Tags
                    </v-tab>
                </v-tabs>
            </v-col>
            <v-col class="pt-3 pt-md-0">
                <router-view />
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import MainTitle from '@/components/MainTitle.vue'

@Component({ components: { MainTitle } })
export default class SettingsComponent extends Vue {}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.v-tabs::v-deep {
    .v-slide-group__prev,
    .v-slide-group__next {
        min-width: initial;
        flex-basis: auto;
    }
}

@media #{map-get($display-breakpoints, 'xs-only')} {
    .v-tabs::v-deep .v-tab {
        font-size: 0.7rem;
        padding: 0 8px;
    }
}
</style>
