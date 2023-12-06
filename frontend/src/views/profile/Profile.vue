<template>
    <div>
        <MainTitle class="mb-2 mb-md-6">Profile</MainTitle>

        <v-row v-if="user" :no-gutters="$vuetify.breakpoint.smAndDown">
            <v-col :cols="$vuetify.breakpoint.smAndDown ? 12 : 2">
                <v-tabs
                    :vertical="$vuetify.breakpoint.mdAndUp || false"
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
            </v-col>
            <v-col class="pt-3 pt-md-0">
                <router-view />
            </v-col>
        </v-row>
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
