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
            <router-view />
        </template>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TheNavbar from '@/layout/components/TheNavbar.vue'
import TheHeader from '@/layout/components/TheHeader.vue'
import { authService } from '@/services'
import { settingsActions } from '@/store/modules/settings.store'

@Component({
    methods: { isAuthenticated: authService.isAuthenticated },
    components: { TheNavbar, TheHeader },
})
export default class AppMain extends Vue {
    mounted() {
        if (authService.isAuthenticated()) this.$store.dispatch(settingsActions.getSettings)
    }
}
</script>

<style scoped lang="scss">
.h-100 {
    height: 100%;
}
</style>
