<script setup lang="ts">
import MainTitle from '@/components/MainTitle.vue'
import { useDisplay } from 'vuetify'
import { useUserStore } from '@/store'

const { mdAndUp } = useDisplay()
const userStore = useUserStore()
</script>

<template>
  <div>
    <MainTitle icon="mdi-account-circle" class="mb-2 mb-md-6">Profile</MainTitle>

    <template v-if="userStore.user">
      <div class="profile">
        <div class="profile__tabs">
          <v-tabs
            :direction="mdAndUp ? 'vertical' : 'horizontal'"
            color="accent"
            show-arrows
            bg-color="transparent">
            <v-tab :to="{ name: 'profile-user' }" exact class="justify-start">
              <v-icon icon="mdi-account-circle" start />
              Profile
            </v-tab>
            <v-tab :to="{ name: 'profile-email' }" exact class="justify-start">
              <v-icon icon="mdi-at" start />
              Email
            </v-tab>
            <v-tab :to="{ name: 'profile-password' }" exact class="justify-start">
              <v-icon icon="mdi-lock" start />
              Password
            </v-tab>
            <v-tab :to="{ name: 'profile-account' }" exact class="justify-start">
              <v-icon icon="mdi-cog" start />
              Account
            </v-tab>
          </v-tabs>
        </div>
        <div class="profile__content">
          <router-view />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
@use 'sass:map';
@use 'vuetify/lib/styles/settings/_variables';

.profile {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__tabs {
    .v-tabs :deep(.v-slide-group__prev, .v-slide-group__next) {
      min-width: initial;
      flex-basis: auto;
    }

    @media #{map.get(variables.$display-breakpoints, 'xs')} {
      .v-tabs :deep(.v-tab) {
        font-size: 0.7rem;
        padding: 0 8px;
      }
    }
  }

  &__content {
    flex-grow: 1;
  }
}

@media #{map.get(variables.$display-breakpoints, 'md-and-up')} {
  .profile {
    flex-direction: row;

    &__tabs {
      flex: 0 0 calc(100% / 6 - 12px);
    }
  }
}
</style>
