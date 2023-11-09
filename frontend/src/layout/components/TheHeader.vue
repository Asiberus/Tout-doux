<template>
    <div class="flex-fill d-flex justify-end align-center">
        <v-menu v-if="user" offset-y>
            <template v-slot:activator="{ on, attrs }">
                <v-btn v-bind="attrs" v-on="on" depressed class="header-menu text-body-1">
                    <v-avatar size="24" left class="mr-1">
                        <v-icon>mdi-account-circle</v-icon>
                    </v-avatar>
                    {{ user.username }}
                </v-btn>
            </template>
            <v-list>
                <v-list-item>
                    <v-icon small left>mdi-account-circle</v-icon>
                    <v-list-item-title>Profile</v-list-item-title>
                </v-list-item>
                <v-list-item :to="{ name: 'settings-preferences' }" class="header-menu__link">
                    <v-icon small left>mdi-cog</v-icon>
                    <v-list-item-title>Settings</v-list-item-title>
                </v-list-item>
                <v-list-item @click="logout()">
                    <v-icon small left>mdi-logout</v-icon>
                    <v-list-item-title>Logout</v-list-item-title>
                </v-list-item>
                <v-list-item>
                    <span class="font-italic text-body-2">Give a feedback!</span>
                </v-list-item>
            </v-list>
        </v-menu>

        <span class="version ml-4 mr-2" :title="`Tout Doux version : ${appVersion}`">
            v{{ appVersion }}
        </span>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { config } from '@/config'
import { authService } from '@/services'
import { userActions } from '@/store/modules/user.store'
import { preferencesActions } from '@/store/modules/preferences.store'
import { User } from '@/models/user.model'

@Component
export default class TheHeader extends Vue {
    appVersion = config.VERSION

    get user(): User | undefined {
        return this.$store.state.user.user
    }

    logout(): void {
        authService.logout().then(() => {
            this.$store.dispatch(userActions.removeUser)
            this.$store.dispatch(preferencesActions.removePreferences)
            this.$router.push({ name: 'login' })
        })
    }
}
</script>

<style scoped lang="scss">
.version {
    font-size: 0.95rem;
    color: #bdbdbd;
}

.header-menu {
    padding: 0 8px !important;
    min-width: 0 !important;
    text-transform: capitalize;

    &__link {
        &.v-list-item--active::before {
            opacity: 0;
        }
    }
}
</style>
