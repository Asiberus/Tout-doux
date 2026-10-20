<script setup lang="ts">
import { useDueStore } from '@/store'
import { useDisplay } from 'vuetify'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

const { mobile } = useDisplay()
const route = useRoute()
const router = useRouter()
const dueStore = useDueStore()

const navbarDisplayed = defineModel<boolean>()

interface MenuItem {
  name: string
  icon: string
  link?: RouteLocationRaw
  showDue?: boolean
}

const menu: MenuItem[] = [
  { name: 'Dashboard', icon: 'mdi-view-dashboard' },
  { name: 'Daily', link: { name: 'daily-summary' }, icon: 'mdi-trophy', showDue: true },
  { name: 'Projects', link: { name: 'project-list' }, icon: 'mdi-briefcase-variant' },
  { name: 'Collections', link: { name: 'collection-list' }, icon: 'mdi-list-box' },
  { name: 'Agenda', link: { name: 'agenda' }, icon: 'mdi-calendar-month' },
]

function isItemActive(item: MenuItem): boolean {
  if (!item.link) return false
  const base = router.resolve(item.link).path
  return route.path === base || route.path.startsWith(`${base}/`)
}
</script>

<template>
  <v-navigation-drawer v-model="navbarDisplayed" touchless>
    <v-list>
      <v-list-item class="pt-3 pb-4">
        <v-list-item-title class="text-headline-large text-center">Tout Doux</v-list-item-title>
      </v-list-item>

      <v-btn
        v-if="mobile"
        icon="mdi-arrow-left"
        variant="text"
        density="comfortable"
        class="close-navbar"
        @click="navbarDisplayed = false" />

      <v-divider />

      <v-list-item
        v-for="(item, i) in menu"
        :key="i"
        :to="item.link"
        :active="isItemActive(item)"
        :disabled="!item.link"
        class="py-3 py-sm-0">
        <v-list-item-title class="text-body-large d-flex align-center">
          <v-icon
            :icon="item.icon"
            size="small"
            class="my-4 mr-3"
            :class="{ disabled: !item.link }" />
          {{ item.name }}
          <v-chip
            v-if="item.showDue && dueStore.toPlanCount > 0"
            :color="dueStore.hasLate ? 'red-accent-2' : 'orange'"
            size="small"
            class="ms-auto"
            :title="`${dueStore.toPlanCount} late or due today, not planned yet`">
            {{ dueStore.toPlanCount }}
          </v-chip>
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<style scoped lang="scss">
.close-navbar {
  position: absolute;
  top: 0;
  right: 0;
}

.disabled {
  color: inherit;
}
</style>
