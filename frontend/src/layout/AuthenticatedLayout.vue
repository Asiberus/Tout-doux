<script setup lang="ts">
import TheNavbar from '@/layout/components/TheNavbar.vue'
import TheHeader from '@/layout/components/TheHeader.vue'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'
import { useUserStore } from '@/store'

const { mobile } = useDisplay()
const userStore = useUserStore()

const navbarDisplayed = ref(!mobile.value)
const headerMenu = ref(false)

function showNavbar(): void {
  if (!mobile.value) return

  navbarDisplayed.value = true
  headerMenu.value = false
}

function hideNavbar(): void {
  if (!mobile.value) return

  navbarDisplayed.value = false
}
</script>

<template>
  <v-app v-if="userStore.user" v-touch="{ left: hideNavbar }">
    <TheNavbar v-model="navbarDisplayed" />
    <TheHeader v-model:header-menu="headerMenu" v-model:navbar-displayed="navbarDisplayed" />

    <v-main v-touch="{ right: showNavbar }">
      <v-container fluid class="pa-3 pa-sm-5 pa-lg-6 h-100">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
