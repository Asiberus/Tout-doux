<template>
    <div>
        <h1 class="text-h3 mb-5">Profile</h1>

        <v-row v-if="user">
            <v-col cols="2">
                <v-tabs vertical color="accent" background-color="transparent">
                    <v-tab :to="{ name: 'profile-user' }" exact class="justify-start">
                        <v-icon left small>mdi-account-circle</v-icon>
                        Profile
                    </v-tab>
                    <v-tab :to="{ name: 'profile-email' }" exact class="justify-start">
                        <v-icon left small>mdi-at</v-icon>
                        Email
                    </v-tab>
                    <v-tab :to="{ name: 'profile-account' }" exact class="justify-start">
                        <v-icon left small>mdi-cog</v-icon>
                        Account
                    </v-tab>
                    <v-tab :to="{ name: 'profile-password' }" exact class="justify-start">
                        <v-icon left small>mdi-lock</v-icon>
                        Password
                    </v-tab>
                </v-tabs>
            </v-col>
            <v-col>
                <router-view />
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { User } from '@/models/user.model'

@Component
export default class ProfileComponent extends Vue {
    get user(): User | undefined {
        return this.$store.state.user.user
    }
}
</script>

<style scoped lang="scss"></style>
