<script setup lang="ts">
import MainTitle from '@/components/MainTitle.vue'
import { useDisplay } from 'vuetify'
import { useUserStore } from '@/store'

const display = useDisplay()
const userStore = useUserStore()
</script>

<template>
  <div>
    <MainTitle icon="mdi-account-circle" class="mb-2 mb-md-6">Profile</MainTitle>

    <template v-if="userStore.user">
      <div class="profile">
        <div class="profile__tabs">
          <v-tabs
            :direction="display.mdAndUp ? 'vertical' : 'horizontal'"
            color="accent"
            show-arrows
            bg-color="transparent">
            <v-tab :to="{ name: 'profile-user' }" exact class="justify-start">
              <v-icon start size="small">mdi-account-circle</v-icon>
              Profile
            </v-tab>
            <v-tab :to="{ name: 'profile-email' }" exact class="justify-start">
              <v-icon start size="small">mdi-at</v-icon>
              Email
            </v-tab>
            <v-tab :to="{ name: 'profile-password' }" exact class="justify-start">
              <v-icon start size="small">mdi-lock</v-icon>
              Password
            </v-tab>
            <v-tab :to="{ name: 'profile-account' }" exact class="justify-start">
              <v-icon start size="small">mdi-cog</v-icon>
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
@import 'vuetify/settings';

.profile {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__tabs {
    .v-tabs :deep(.v-slide-group__prev, .v-slide-group__next) {
      min-width: initial;
      flex-basis: auto;
    }

    @media #{map-get($display-breakpoints, 'xs')} {
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

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .profile {
    flex-direction: row;

    &__tabs {
      flex: 0 0 calc(100% / 6 - 12px);
    }
  }
}
</style>
