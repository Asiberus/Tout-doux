<script setup lang="ts">
import TheNavbar from '@/layout/components/TheNavbar.vue'
import TheHeader from '@/layout/components/TheHeader.vue'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'
import { useUserStore } from '@/store'

const display = useDisplay()
const userStore = useUserStore()

const displayNavbar = ref(display.mobile)
const headerMenu = ref(false)

function showNavbar(): void {
  if (!display.mobile) return

  displayNavbar.value = true
  headerMenu.value = false
}

function hideNavbar(): void {
  if (!display.mobile) return

  displayNavbar.value = false
}
</script>

<template>
  <v-app v-if="userStore.user" v-touch="{ left: hideNavbar }">
    <v-navigation-drawer v-model="displayNavbar" app touchless>
      <TheNavbar @display-navbar="displayNavbar = $event" />
    </v-navigation-drawer>
    <v-app-bar app dense>
      <TheHeader v-model:header-menu="headerMenu" v-model:display-navbar="displayNavbar" />
    </v-app-bar>
    <v-main v-touch="{ right: showNavbar }">
      <v-container fluid class="pa-3 pa-sm-5 pa-lg-6 h-100">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
