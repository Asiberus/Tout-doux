<script setup lang="ts">
import { config } from '@/config'
import { authService } from '@/services'
import { useUserStore } from '@/store'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const router = useRouter()
const { mobile } = useDisplay()
const userStore = useUserStore()

const navbarDisplayed = defineModel<boolean>('navbarDisplayed')
const headerMenu = defineModel<boolean>('headerMenu')

const appVersion = config.VERSION

function logout(): void {
  authService.logout().then(() => router.push({ name: 'login' }))
}
</script>

<template>
  <v-app-bar density="compact" class="pr-4">
    <template v-if="mobile" #prepend>
      <v-app-bar-nav-icon @click="navbarDisplayed = !navbarDisplayed" />
    </template>

    <v-spacer />

    <v-menu v-if="userStore.user" v-model="headerMenu">
      <template #activator="{ props }">
        <v-btn variant="flat" class="header-menu-btn text-body-1" v-bind="props">
          <v-avatar size="24" color="transparent" class="mr-1">
            <v-icon icon="mdi-account-circle" />
          </v-avatar>
          {{ userStore.loadedUser.username }}
        </v-btn>
      </template>

      <v-list>
        <v-list-item :to="{ name: 'profile-user' }" class="header-menu-link" :ripple="false">
          <v-list-item-title class="d-flex align-center">
            <v-icon icon="mdi-account-circle" size="small" start />
            Profile
          </v-list-item-title>
        </v-list-item>
        <v-list-item
          :to="{ name: 'settings-preferences' }"
          class="header-menu-link"
          :ripple="false">
          <v-list-item-title class="d-flex align-center">
            <v-icon icon="mdi-cog" size="small" start />
            Settings
          </v-list-item-title>
        </v-list-item>
        <template v-if="userStore.loadedUser.isStaff">
          <v-list-item
            :to="{ name: 'administration-user-list' }"
            class="header-menu-link"
            :ripple="false">
            <v-list-item-title class="d-flex align-center">
              <v-icon icon="mdi-security" size="small" start />
              Administration
            </v-list-item-title>
          </v-list-item>
        </template>
        <v-list-item :ripple="false" @click="logout()">
          <v-list-item-title class="d-flex align-center">
            <v-icon icon="mdi-logout" size="small" start />
            Logout
          </v-list-item-title>
        </v-list-item>
        <v-hover v-slot="{ isHovering, props }">
          <v-list-item
            v-bind="props"
            :to="{ name: 'feedback' }"
            density="compact"
            :ripple="false"
            class="font-italic text-body-2 text-link text-center feedback-link"
            :class="{ 'text-grey': !isHovering, 'text-white': isHovering }">
            Give a feedback!
          </v-list-item>
        </v-hover>
      </v-list>
    </v-menu>

    <span class="version mx-2" :title="`Tout Doux version : ${appVersion}`">
      v{{ appVersion }}
    </span>
  </v-app-bar>
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
    :deep(.v-list-item__overlay) {
      opacity: 0;
    }

    &:hover :deep(.v-list-item__overlay) {
      opacity: calc(var(--v-hover-opacity) * var(--v-theme-overlay-multiplier));
    }
  }
}

.feedback-link :deep(.v-list-item__overlay) {
  opacity: 0;
}
</style>
