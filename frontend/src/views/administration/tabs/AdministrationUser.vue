<script setup lang="ts">
import { userApi } from '@/api'
import { dateFormat } from '@/pipes'
import { User } from '@/models/user.model'
import ConfirmPasswordDialog from '@/components/ConfirmPasswordDialog.vue'
import TertiaryTitle from '@/components/TertiaryTitle.vue'
import { onBeforeMount, ref } from 'vue'
import { useUserStore } from '@/store'
import { booleanSort } from '@/utils/boolean-sort.utils'

const userStore = useUserStore()

onBeforeMount(() => {
  loading.value = true
  userApi
    .getUserList()
    .then(response => (userList.value = response.content))
    .catch(error => console.error(error))
    .finally(() => (loading.value = false))
})

const userList = ref<User[]>([])
const loading = ref(false)

const headerDefinition = [
  { text: 'Username', value: 'username' },
  { text: 'First name', value: 'firstName', align: 'center' },
  { text: 'Last name', value: 'lastName', align: 'center' },
  { text: 'Email', value: 'email' },
  { text: 'Account created', value: 'dateJoined', align: 'center' },
  { text: 'Last login', value: 'lastLogin', align: 'center' },
  { text: 'Active', value: 'isActive', align: 'center', sort: booleanSort },
  { text: 'Staff', value: 'isStaff', align: 'center', sort: booleanSort },
  { text: 'Actions', value: 'actions', align: 'center', sortable: false },
]

function resendActivationEmail(id: number): void {
  userApi
    .resendActivationEmail(id)
    .then(() => {
      // TODO : add notification
      console.log('Activation email resend successfully!')
    })
    .catch(error => console.error(error))
}

function changeUserAccountState(id: number, active: boolean): void {
  userApi
    .changeAccountState(id, { active })
    .then(response => {
      const index = userList.value.findIndex(user => user.id === id)
      if (index !== -1) userList.value.splice(index, 1, response)
    })
    .catch(error => console.error(error))
}

function deleteUser(id: number): void {
  userApi
    .deleteUser(id)
    .then(() => {
      const index = userList.value.findIndex(user => user.id === id)
      if (index !== -1) userList.value.splice(index, 1)
    })
    .catch(error => console.error(error))
}
</script>

<template>
  <div>
    <TertiaryTitle>User list</TertiaryTitle>

    <v-data-table :items="userList" :headers="headerDefinition" :loading>
      <template #item.username="{ item, value }">
        {{ value }}
        <template v-if="item.id === userStore.loadedUser.id">
          <v-icon icon="mdi-account-circle" size="small" title="Account connected" />
        </template>
      </template>
      <template #item.firstName="{ value }">{{ value ? value : '-' }}</template>
      <template #item.lastName="{ value }">{{ value ? value : '-' }}</template>
      <template #item.dateJoined="{ value }">
        <template v-if="value">{{ dateFormat(value, 'DD/MM/YYYY') }}</template>
        <template v-else>-</template>
      </template>
      <template #item.lastLogin="{ value }">
        <template v-if="value">{{ dateFormat(value, 'DD/MM/YYYY - HH:mm') }}</template>
        <template v-else>-</template>
      </template>
      <template #item.isActive="{ value }">
        <template v-if="value">
          <v-icon icon="mdi-check-circle" color="success" />
        </template>
        <template v-else>
          <v-icon icon="mdi-close-circle" color="error" />
        </template>
      </template>
      <template #item.isStaff="{ value }">
        <template v-if="value">
          <v-icon icon="mdi-security" color="info" />
        </template>
      </template>
      <template #item.actions="{ item }">
        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" :disabled="item.id === userStore.loadedUser.id" variant="plain">
              <v-icon icon="mdi-dots-vertical" />
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="resendActivationEmail(item.id)">
              <v-list-item-title class="d-flex align-center">
                <v-icon icon="mdi-email-sync" size="small" start />
                Resend activation email
              </v-list-item-title>
            </v-list-item>
            <template v-if="item.isActive">
              <v-list-item @click="changeUserAccountState(item.id, false)">
                <v-list-item-title class="d-flex align-center">
                  <v-icon icon="mdi-account-remove" size="small" start />
                  Deactivate user
                </v-list-item-title>
              </v-list-item>
            </template>
            <template v-else>
              <v-list-item @click="changeUserAccountState(item.id, true)">
                <v-list-item-title class="d-flex align-center">
                  <v-icon icon="mdi-account-check" size="small" start />
                  Activate user
                </v-list-item-title>
              </v-list-item>
            </template>
            <ConfirmPasswordDialog @password-confirmed="deleteUser(item.id)">
              <template #activator="{ props }">
                <v-list-item v-bind="props">
                  <v-list-item-title class="d-flex align-center">
                    <v-icon icon="mdi-trash-can" size="small" start />
                    Delete user
                  </v-list-item-title>
                </v-list-item>
              </template>
            </ConfirmPasswordDialog>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>
  </div>
</template>
