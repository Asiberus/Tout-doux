<template>
    <div class="profile-user">
        <v-form v-model="form.valid" @submit.prevent="submit()" class="flex-grow-1">
            <div class="profile-user__username">
                <v-avatar
                    v-if="$vuetify.breakpoint.smAndDown"
                    :size="avatarSize"
                    color="grey lighten-3"
                    class="avatar">
                    <img src="../../../assets/avatar.svg" alt="avatar placeholder" />
                </v-avatar>
                <v-text-field
                    label="Username"
                    v-model="form.data.username"
                    :rules="form.rules.username"
                    :error-messages="usernameUniqueError"
                    @input="validateUsername"
                    required
                    counter="100">
                </v-text-field>
            </div>

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
                class="mb-5">
            </v-textarea>

            <v-btn
                color="success"
                type="submit"
                :disabled="!canSubmit"
                :block="$vuetify.breakpoint.xsOnly"
                class="float-sm-right">
                update
            </v-btn>
        </v-form>

        <v-avatar
            v-if="$vuetify.breakpoint.mdAndUp"
            :size="avatarSize"
            color="grey lighten-3"
            class="avatar">
            <img src="../../../assets/avatar.svg" alt="avatar placeholder" />
        </v-avatar>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
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
            username: this.user.username,
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            bio: this.user.bio,
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

    get user(): User {
        return this.$store.state.user.user
    }

    get isFormUntouched(): boolean {
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

    get avatarSize(): number {
        if (this.$vuetify.breakpoint.xsOnly) return 75
        else if (this.$vuetify.breakpoint.smOnly) return 125
        else if (this.$vuetify.breakpoint.mdOnly) return 175
        else if (this.$vuetify.breakpoint.width <= 1600) return 225
        else return 250
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
            .isUsernameUnique({ username: value, excludeId: this.user.id })
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
@import '~vuetify/src/styles/styles.sass';

.profile-user {
    display: flex;

    &__username {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        @media #{map-get($display-breakpoints, 'sm-and-up')} {
            gap: 16px;
        }
    }

    .avatar img {
        width: 66.6%;
    }
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
    .profile-user {
        column-gap: 24px;
    }
}

@media only screen and (width > 1600px) {
    .profile-user {
        column-gap: 48px;

        .avatar {
            margin-right: 24px;
        }
    }
}
</style>
