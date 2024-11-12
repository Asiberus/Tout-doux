<script setup lang="ts">
import { config } from '@/config'
import { authService } from '@/services'
import { useUserStore } from '@/store'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const router = useRouter()
const display = useDisplay()
const userStore = useUserStore()

const displayNavbar = defineModel<boolean>('displayNavbar')
const headerMenu = defineModel<boolean>('headerMenu')

const appVersion = config.VERSION

function logout(): void {
  authService.logout().then(() => router.push({ name: 'login' }))
}
</script>

<template>
  <div class="flex-fill d-flex align-center">
    <v-btn v-if="display.mobile" icon size="small" @click="displayNavbar = !displayNavbar">
      <v-icon>mdi-menu</v-icon>
    </v-btn>

    <v-spacer></v-spacer>

    <v-menu :model-value="headerMenu" offset-y @update:model-value="headerMenu = $event">
      <template #activator="{ props }">
        <v-btn variant="flat" class="header-menu-btn text-body-1" v-bind="props">
          <v-avatar size="24" start class="mr-1">
            <v-icon>mdi-account-circle</v-icon>
          </v-avatar>
          {{ userStore.user.username }}
        </v-btn>
      </template>
      <v-list>
        <v-list-item :to="{ name: 'profile-user' }" class="header-menu-link" :ripple="false">
          <v-icon size="small" start>mdi-account-circle</v-icon>
          <v-list-item-title>Profile</v-list-item-title>
        </v-list-item>
        <v-list-item
          :to="{ name: 'settings-preferences' }"
          class="header-menu-link"
          :ripple="false">
          <v-icon size="small" start>mdi-cog</v-icon>
          <v-list-item-title>Settings</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="userStore.user.isStaff"
          :to="{ name: 'administration-user-list' }"
          class="header-menu-link"
          :ripple="false">
          <v-icon size="small" start>mdi-security</v-icon>
          <v-list-item-title>Administration</v-list-item-title>
        </v-list-item>
        <v-list-item :ripple="false" @click="logout()">
          <v-icon size="small" start>mdi-logout</v-icon>
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
        <v-list-item class="justify-center" density="compact" :ripple="false">
          <v-hover v-slot="{ hover }">
            <router-link
              :to="{ name: 'feedback' }"
              class="font-italic text-body-2 text-link"
              :class="{ 'grey--text': !hover, 'white--text': hover }">
              Give a feedback!
            </router-link>
          </v-hover>
        </v-list-item>
      </v-list>
    </v-menu>

    <span class="version mx-2" :title="`Tout Doux version : ${appVersion}`">
      v{{ appVersion }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.version {
  font-size: 0.95rem;
}

.header-menu-btn {
  padding: 0 8px !important;
  min-width: 0 !important;
  text-transform: capitalize;
}

.header-menu-link {
  &.v-list-item--active {
    &::before {
      opacity: 0;
    }

    &:hover::before {
      opacity: 0.08;
    }
  }
}
</style>
