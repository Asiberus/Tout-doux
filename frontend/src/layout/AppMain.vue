<template>
    <v-app>
        <v-navigation-drawer app><TheNavbar></TheNavbar></v-navigation-drawer>
        <v-app-bar app dense></v-app-bar>
        <v-main>
            <v-container fluid>
                <router-view />
            </v-container>
        </v-main>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TheNavbar from '@/layout/components/TheNavbar.vue'

@Component({
    components: {
        TheNavbar,
    },
})
export default class AppMain extends Vue {}
</script>

<style scoped></style>
