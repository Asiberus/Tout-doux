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
        <template v-if="item.id === userStore.user.id">
          <v-icon size="small" title="Account connected">mdi-account-circle</v-icon>
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
          <v-icon color="success">mdi-check-circle</v-icon>
        </template>
        <template v-else>
          <v-icon color="error">mdi-close-circle</v-icon>
        </template>
      </template>
      <template #item.isStaff="{ value }">
        <template v-if="value">
          <v-icon color="info">mdi-security</v-icon>
        </template>
      </template>
      <template #item.actions="{ item }">
        <v-menu offset-y offset-x>
          <template #activator="{ props }">
            <v-btn v-bind="props" :disabled="item.id === userStore.user.id" variant="plain">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="resendActivationEmail(item.id)">
              <v-icon size="small" start>mdi-email-sync</v-icon>
              <v-list-item-title>Resend activation email</v-list-item-title>
            </v-list-item>
            <template v-if="item.isActive">
              <v-list-item @click="changeUserAccountState(item.id, false)">
                <v-icon size="small" start>mdi-account-remove</v-icon>
                <v-list-item-title>Deactivate user</v-list-item-title>
              </v-list-item>
            </template>
            <template v-else>
              <v-list-item @click="changeUserAccountState(item.id, true)">
                <v-icon size="small" start>mdi-account-check</v-icon>
                <v-list-item-title>Activate user</v-list-item-title>
              </v-list-item>
            </template>
            <ConfirmPasswordDialog @password-confirmed="deleteUser(item.id)">
              <template #activator="{ props }">
                <v-list-item v-bind="props">
                  <v-icon size="small" start>mdi-trash-can</v-icon>
                  <v-list-item-title>Delete user</v-list-item-title>
                </v-list-item>
              </template>
            </ConfirmPasswordDialog>
          </v-list>
        </v-menu>
      </template>
    </v-data-table>
  </div>
</template>
