<template>
    <div>
        <MainTitle icon="mdi-security" class="mb-2 mb-md-6">Administration</MainTitle>

        <div class="administration">
            <div class="administration__tabs">
                <v-tabs
                    :vertical="$vuetify.breakpoint.mdAndUp"
                    color="accent"
                    show-arrows
                    background-color="transparent">
                    <v-tab :to="{ name: 'administration-user-list' }" exact class="justify-start">
                        <v-icon left small>mdi-account-group</v-icon>
                        User List
                    </v-tab>
                    <v-tab :to="{ name: 'administration-feedback' }" exact class="justify-start">
                        <v-icon left small>mdi-comment-quote</v-icon>
                        Feedback
                    </v-tab>
                </v-tabs>
            </div>
            <div class="administration__content">
                <router-view />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import MainTitle from '@/components/MainTitle.vue'

@Component({
    components: { MainTitle },
})
export default class Administration extends Vue {}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.administration {
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
    .administration {
        flex-direction: row;

        &__tabs {
            flex: 0 0 calc(100% / 6 - 12px);
        }
    }
}
</style>
