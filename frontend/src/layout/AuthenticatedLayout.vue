<script setup lang="ts">
import TheNavbar from '@/layout/components/TheNavbar.vue'
import TheHeader from '@/layout/components/TheHeader.vue'
import { useDisplay } from 'vuetify'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { dragInProgress } from '@/components/sortable/dnd-kit'
import { useDueStore, useNotificationStore, useUserStore } from '@/store'
import { useToday } from '@/composables/useToday'

const { mobile, xs } = useDisplay()
const userStore = useUserStore()
const notificationStore = useNotificationStore()
const dueStore = useDueStore()
const { today } = useToday()

const todayKey = computed<string>(() => today.value.format('YYYY-MM-DD'))

const navbarDisplayed = ref(!mobile.value)
const headerMenu = ref(false)

watch(todayKey, () => dueStore.refresh({ force: true }), { immediate: true })

function refreshDueOnReturn(): void {
  if (document.visibilityState === 'visible') dueStore.refresh()
}

onMounted(() => document.addEventListener('visibilitychange', refreshDueOnReturn))
onUnmounted(() => document.removeEventListener('visibilitychange', refreshDueOnReturn))

function showNavbar(): void {
  if (!mobile.value || dragInProgress.value) return

  navbarDisplayed.value = true
  headerMenu.value = false
}

function hideNavbar(): void {
  if (!mobile.value || dragInProgress.value) return

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

    <v-snackbar-queue
      v-model="notificationStore.queue"
      :location="xs ? 'top' : 'top right'"
      closable>
      <template #actions="{ props: closeProps }">
        <v-btn v-bind="closeProps" icon variant="text" size="small" density="comfortable">
          <v-icon icon="mdi-close" />
        </v-btn>
      </template>
    </v-snackbar-queue>
  </v-app>
</template>
