<template>
    <v-app>
        <template v-if="isAuthenticated()">
            <v-navigation-drawer app>
                <TheNavbar></TheNavbar>
            </v-navigation-drawer>
            <v-app-bar app dense>
                <TheHeader></TheHeader>
            </v-app-bar>
            <v-main>
                <v-container fluid class="pa-8 h-100">
                    <router-view />
                </v-container>
            </v-main>
        </template>
        <template v-else>
            <div class="non-authenticated-wrapper">
                <div class="router-view-wrapper">
                    <router-link :to="{ name: 'login' }">
                        <h1 class="text-h1 green--text mb-6 text-center">Tout Doux</h1>
                    </router-link>

                    <router-view />
                </div>
            </div>
        </template>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TheNavbar from '@/layout/components/TheNavbar.vue'
import TheHeader from '@/layout/components/TheHeader.vue'
import { authService } from '@/services'
import { preferencesActions } from '@/store/modules/preferences.store'

@Component({
    methods: { isAuthenticated: authService.isAuthenticated },
    components: { TheNavbar, TheHeader },
})
export default class AppMain extends Vue {
    mounted() {
        if (authService.isAuthenticated()) this.$store.dispatch(preferencesActions.getPreferences)
    }
}
</script>

<style scoped lang="scss">
.h-100 {
    height: 100%;
}

.non-authenticated-wrapper {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .router-view-wrapper {
        min-width: 400px;

        a {
            text-decoration: none;
            color: inherit;
        }
    }
}
</style>
