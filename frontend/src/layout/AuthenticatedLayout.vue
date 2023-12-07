<template>
    <v-app v-touch="{ left: hideNavbar }">
        <v-navigation-drawer v-model="displayNavbar" app touchless>
            <TheNavbar></TheNavbar>
        </v-navigation-drawer>
        <v-app-bar app dense>
            <TheHeader
                :header-menu.sync="headerMenu"
                :display-navbar.sync="displayNavbar"></TheHeader>
        </v-app-bar>
        <v-main v-touch="{ right: showNavbar }">
            <v-container fluid class="pa-3 pa-sm-5 pa-lg-7 h-100">
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
    headerMenu = false

    showNavbar(): void {
        if (!this.$vuetify.breakpoint.mobile) return

        this.displayNavbar = true
        this.headerMenu = false
    }

    hideNavbar(): void {
        if (!this.$vuetify.breakpoint.mobile) return

        this.displayNavbar = false
    }
}
</script>
