<template>
    <div>
        <MainTitle icon="mdi-account-circle" class="mb-2 mb-md-6">Profile</MainTitle>

        <template v-if="user">
            <div class="profile">
                <div class="profile__tabs">
                    <v-tabs
                        :vertical="$vuetify.breakpoint.mdAndUp"
                        color="accent"
                        show-arrows
                        background-color="transparent">
                        <v-tab :to="{ name: 'profile-user' }" exact class="justify-start">
                            <v-icon left small>mdi-account-circle</v-icon>
                            Profile
                        </v-tab>
                        <v-tab :to="{ name: 'profile-email' }" exact class="justify-start">
                            <v-icon left small>mdi-at</v-icon>
                            Email
                        </v-tab>
                        <v-tab :to="{ name: 'profile-password' }" exact class="justify-start">
                            <v-icon left small>mdi-lock</v-icon>
                            Password
                        </v-tab>
                        <v-tab :to="{ name: 'profile-account' }" exact class="justify-start">
                            <v-icon left small>mdi-cog</v-icon>
                            Account
                        </v-tab>
                    </v-tabs>
                </div>
                <div class="profile__content">
                    <router-view />
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { User } from '@/models/user.model'
import MainTitle from '@/components/MainTitle.vue'

@Component({
    components: { MainTitle },
})
export default class ProfileComponent extends Vue {
    get user(): User | undefined {
        return this.$store.state.user.user
    }
}
</script>

<style scoped lang="scss">
@import '~vuetify/src/styles/styles.sass';

.profile {
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
    .profile {
        flex-direction: row;

        &__tabs {
            flex: 0 0 calc(100% / 6 - 12px);
        }
    }
}
</style>
