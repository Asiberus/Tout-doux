<template>
    <v-app>
        <v-navigation-drawer app><TheNavbar></TheNavbar></v-navigation-drawer>
        <v-app-bar app dense><TheHeader></TheHeader></v-app-bar>
        <v-main>
            <v-container fluid class="px-8">
                <router-view />
            </v-container>
        </v-main>
    </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import TheNavbar from '@/layout/components/TheNavbar.vue'
import TheHeader from '@/layout/components/TheHeader.vue'

@Component({
    components: {
        TheNavbar,
        TheHeader,
    },
})
export default class AppMain extends Vue {}
</script>

<style scoped></style>
