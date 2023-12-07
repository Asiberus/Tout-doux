<template>
    <div class="fill-height d-flex flex-column">
        <MainTitle class="mb-2 mb-md-6">Settings</MainTitle>

        <div class="settings">
            <div class="settings__tabs">
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
            </div>
            <div class="settings__content">
                <router-view />
            </div>
        </div>
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

.settings {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;

    &__tabs {
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
    }

    &__content {
        flex-grow: 1;
    }
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
    .settings {
        flex-direction: row;

        &__tabs {
            flex: 0 0 calc(100% / 6 - 12px);
        }
    }
}
</style>
