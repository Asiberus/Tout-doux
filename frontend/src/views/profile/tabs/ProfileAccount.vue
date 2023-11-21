<template>
    <div class="profile-account">
        <div class="text-h4 mb-4">Delete your account</div>
        <p class="text-subtitle-1 mb-1">
            You can delete your account by clicking on the button bellow. This action will delete
            all your <span class="font-weight-bold">projects, collections, tasks and events</span>.
        </p>
        <p class="text-subtitle-1 font-italic">Please be careful, this action is not reversible.</p>

        <ConfirmPasswordDialog @password-confirmed="deleteAccount()">
            <template #activator="{ attrs, on }">
                <v-btn v-bind="attrs" v-on="on" color="error">Delete my account</v-btn>
            </template>
        </ConfirmPasswordDialog>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ConfirmPasswordDialog from '@/components/ConfirmPasswordDialog.vue'
import { userApi } from '@/api'
import { authService } from '@/services'

@Component({
    components: { ConfirmPasswordDialog },
})
export default class ProfileAccount extends Vue {
    deleteAccount(): void {
        userApi
            .deleteAccount()
            .then(() => {
                authService.removeToken()
                authService.resetStore()
                this.$router.push({ name: 'login' })
            })
            .catch((error: any) => console.error(error))
    }
}
</script>

<style scoped lang="scss">
.profile-account {
    width: 75%;
}
</style>
