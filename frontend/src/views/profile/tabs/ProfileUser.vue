<template>
    <div class="profile-user">
        <v-form v-model="form.valid" @submit.prevent="submit()" class="flex-grow-1">
            <v-text-field
                label="Username"
                v-model="form.data.username"
                :rules="form.rules.username"
                :error-messages="usernameUniqueError"
                @input="validateUsername"
                required
                counter="100">
            </v-text-field>

            <v-text-field
                label="First Name"
                v-model="form.data.firstName"
                :rules="form.rules.firstName"
                counter="100">
            </v-text-field>

            <v-text-field
                label="Last Name"
                v-model="form.data.lastName"
                :rules="form.rules.lastName"
                counter="100">
            </v-text-field>

            <v-textarea
                label="Bio"
                v-model="form.data.bio"
                :rules="form.rules.bio"
                @keyup.enter.ctrl="submit()"
                counter="500"
                rows="4"
                auto-grow
                class="mb-8">
            </v-textarea>

            <v-btn color="success" type="submit" :disabled="!canSubmit" class="float-right">
                update
            </v-btn>
        </v-form>

        <v-avatar size="250" color="grey lighten-3" class="profile-user__avatar">
            <img src="../../../assets/avatar.svg" alt="avatar placeholder" />
        </v-avatar>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { Form } from '@/models/common.model'
import { User, UserPatch } from '@/models/user.model'
import { userApi } from '@/api'
import { userActions } from '@/store/modules/user.store'

@Component
export default class ProfileUser extends Vue {
    form: Form<UserPatch> = {
        valid: false,
        pending: false,
        data: {
            username: this.user?.username ?? '',
            firstName: this.user?.firstName ?? '',
            lastName: this.user?.lastName ?? '',
            bio: this.user?.bio ?? '',
        },
        rules: {
            username: [
                (value: string) => !!value || 'Username is required',
                (value: string) => value.length <= 100 || 'Max 100 characters',
            ],
            firstName: [(value: string) => value.length <= 100 || 'Max 100 characters'],
            lastName: [(value: string) => value.length <= 100 || 'Max 100 characters'],
            bio: [(value: string) => value.length <= 500 || 'Max 500 characters'],
        },
    }

    usernameUniqueError: string | null = null
    private usernameValidationTimer?: number = undefined

    get user(): User | undefined {
        return this.$store.state.user.user
    }

    get isFormUntouched(): boolean {
        if (!this.user) return true

        return (
            this.form.data.username === this.user.username &&
            this.form.data.firstName === this.user.firstName &&
            this.form.data.lastName === this.user.lastName &&
            this.form.data.bio === this.user.bio
        )
    }

    get canSubmit(): boolean {
        return this.form.valid && !this.form.pending && !this.isFormUntouched
    }

    @Watch('user')
    private onUserChanges(): void {
        if (!this.user) return

        const { username, firstName, lastName, bio } = this.user
        this.form.data = { username, firstName, lastName, bio }
    }

    validateUsername(value: string): void {
        clearTimeout(this.usernameValidationTimer)
        if (value === '') {
            this.usernameUniqueError = null
            return
        }

        this.form.pending = true
        this.usernameValidationTimer = setTimeout(() => this.isUsernameUnique(value), 300)
    }

    private isUsernameUnique(value: string): void {
        userApi
            .isUsernameUnique({ username: value, excludeId: this.user?.id })
            .then((response: any) => {
                this.usernameUniqueError = !response.body.unique
                    ? 'This username is already used'
                    : null
            })
            .catch((error: any) => console.error(error))
            .finally(() => (this.form.pending = false))
    }

    submit(): void {
        if (!this.canSubmit) return

        this.$store.dispatch(userActions.updateUser, this.form.data)
    }
}
</script>

<style scoped lang="scss">
.profile-user {
    display: flex;
    column-gap: 48px;

    &__avatar {
        margin-right: 24px;

        img {
            width: 175px;
        }
    }
}
</style>
