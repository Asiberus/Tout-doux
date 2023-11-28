<template>
    <v-app>
        <v-navigation-drawer v-model="displayNavbar" app>
            <TheNavbar :display-navbar.sync="displayNavbar"></TheNavbar>
        </v-navigation-drawer>
        <v-app-bar app dense>
            <TheHeader :display-navbar.sync="displayNavbar"></TheHeader>
        </v-app-bar>
        <v-main>
            <v-container fluid class="pa-4 pa-sm-6 pa-lg-8 h-100">
                <router-view />
            </v-container>
        </v-main>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TheNavbar from '@/layout/components/TheNavbar.vue'
import TheHeader from '@/layout/components/TheHeader.vue'

@Component({ components: { TheNavbar, TheHeader } })
export default class AuthenticatedLayout extends Vue {
    displayNavbar = !this.$vuetify.breakpoint.mobile
}
</script>

<style scoped lang="scss">
.h-100 {
    height: 100%;
}
</style>
