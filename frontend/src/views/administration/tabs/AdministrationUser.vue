<template>
    <div>
        <div class="text-h4 mb-4">User list</div>
        <v-data-table :headers="headers" :items="userList" :loading="loading">
            <template #item.username="{ item, value }">
                {{ value }}
                <template v-if="item.id === user.id">
                    <v-icon small title="Account connected">mdi-account-circle</v-icon>
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
                    <template #activator="{ attrs, on }">
                        <v-btn v-bind="attrs" v-on="on" plain :disabled="item.id === user.id">
                            <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                    </template>
                    <v-list dense>
                        <v-list-item @click="resendActivationEmail(item.id)">
                            <v-icon small left>mdi-email-sync</v-icon>
                            <v-list-item-title>Resend activation email</v-list-item-title>
                        </v-list-item>
                        <template v-if="item.isActive">
                            <v-list-item @click="changeUserAccountState(item.id, false)">
                                <v-icon small left>mdi-account-remove</v-icon>
                                <v-list-item-title>Deactivate user</v-list-item-title>
                            </v-list-item>
                        </template>
                        <template v-else>
                            <v-list-item @click="changeUserAccountState(item.id, true)">
                                <v-icon small left>mdi-account-check</v-icon>
                                <v-list-item-title>Activate user</v-list-item-title>
                            </v-list-item>
                        </template>
                        <ConfirmPasswordDialog @password-confirmed="deleteUser(item.id)">
                            <template #activator="{ attrs, on }">
                                <v-list-item v-bind="attrs" v-on="on">
                                    <v-icon small left>mdi-trash-can</v-icon>
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

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { userApi } from '@/api'
import { dateFormat } from '@/pipes'
import { User } from '@/models/user.model'
import { DataTableHeader } from 'vuetify'
import ConfirmPasswordDialog from '@/components/ConfirmPasswordDialog.vue'

@Component({
    components: { ConfirmPasswordDialog },
})
export default class AdministrationUser extends Vue {
    userList: User[] = []
    headers: DataTableHeader[] = [
        { text: 'Username', value: 'username' },
        { text: 'First name', value: 'firstName', align: 'center' },
        { text: 'Last name', value: 'lastName', align: 'center' },
        { text: 'Email', value: 'email' },
        { text: 'Account created', value: 'dateJoined', align: 'center' },
        { text: 'Last login', value: 'lastLogin', align: 'center' },
        { text: 'Active', value: 'isActive', align: 'center', sort: this.booleanSort },
        { text: 'Staff', value: 'isStaff', align: 'center', sort: this.booleanSort },
        { text: 'Actions', value: 'actions', align: 'center', sortable: false },
    ]
    loading = false

    get user(): User {
        return this.$store.state.user.user
    }

    created(): void {
        this.loading = true
        userApi
            .getUserList()
            .then((response: any) => {
                this.userList = response.body.content
            })
            .catch((error: any) => console.error(error))
            .finally(() => (this.loading = false))
    }

    resendActivationEmail(id: number): void {
        userApi
            .resendActivationEmail(id)
            .then(() => {
                // TODO : add notification
                console.log('Activation email resend successfully!')
            })
            .catch((error: any) => console.error(error))
    }

    changeUserAccountState(id: number, active: boolean): void {
        userApi
            .changeAccountState(id, { active })
            .then((response: any) => {
                const index = this.userList.findIndex(user => user.id === id)
                if (index !== -1) this.userList.splice(index, 1, response.body)
            })
            .catch((error: any) => console.error(error))
    }

    deleteUser(id: number): void {
        userApi
            .deleteUser(id)
            .then(() => {
                const index = this.userList.findIndex(user => user.id === id)
                if (index !== -1) this.userList.splice(index, 1)
            })
            .catch((error: any) => console.error(error))
    }

    dateFormat(date: string, format: string): string {
        return dateFormat(date, format)
    }

    booleanSort(a: boolean, b: boolean): number {
        if (a && !b) return -1
        else if (!a && b) return 1
        else return 0
    }
}
</script>
