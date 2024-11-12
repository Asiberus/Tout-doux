<script setup lang="ts">
import ConfirmPasswordDialog from '@/components/ConfirmPasswordDialog.vue'
import { userApi } from '@/api'
import { authService } from '@/services'
import TertiaryTitle from '@/components/TertiaryTitle.vue'
import { useRouter } from 'vue-router'

function deleteAccount(): void {
  const router = useRouter()
  userApi
    .deleteAccount()
    .then(() => {
      authService.removeToken()
      authService.resetStore()
      router.push({ name: 'login' })
    })
    .catch(error => console.error(error))
}
</script>

<template>
  <div class="profile-account">
    <TertiaryTitle>Delete your account</TertiaryTitle>

    <p class="text-subtitle-1 mb-1">
      You can delete your account by clicking on the button bellow. This action will delete all your
      <span class="font-weight-bold">projects, collections, tasks and events</span>.
    </p>
    <p class="text-subtitle-1 font-italic">Please be careful, this action is not reversible.</p>

    <ConfirmPasswordDialog @password-confirmed="deleteAccount()">
      <template #activator="{ attrs, on }">
        <v-btn v-bind="attrs" color="error" :block="$vuetify.breakpoint.xs" v-on="on">
          Delete my account
        </v-btn>
      </template>
    </ConfirmPasswordDialog>
  </div>
</template>

<style scoped lang="scss">
@import 'vuetify/settings';

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .profile-account {
    width: 75%;
  }
}
</style>
