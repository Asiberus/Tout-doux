<template>
    <div class="profile-account">
        <div class="text-h4 mb-4">User list</div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { userApi } from '@/api'
import { User } from '@/models/user.model'

@Component
export default class AdministrationUser extends Vue {
    userList: User[] = []

    create(): void {
        userApi.getUserList().then((response: any) => {
            this.userList = response.body.content
        })
    }
}
</script>

<style scoped lang="scss"></style>
