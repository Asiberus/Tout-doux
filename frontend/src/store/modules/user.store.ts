import { Vue } from 'vue-property-decorator'
import { Action, Module, Mutation, VuexModule } from 'vuex-module-decorators'
import { userApi } from '@/api'
import { User } from '@/models/user.model'

const userMutations = {
    setUser: 'SET_USER',
    removeUser: 'REMOVE_USER',
}

export const userActions = {
    getUser: 'getUser',
    removeUser: 'removeUser',
}

@Module
export class UserModule extends VuexModule {
    // State
    user?: User

    // Mutations
    @Mutation
    private [userMutations.setUser](user: User): void {
        Vue.set(this, 'user', user)
    }

    @Mutation
    private [userMutations.removeUser](): void {
        this.user = undefined
    }

    // Actions
    @Action
    async [userActions.getUser](): Promise<void> {
        await userApi
            .getUserConnected()
            .then((response: any) => this.context.commit(userMutations.setUser, response.body))
            .catch((error: any) => console.error(error))
    }

    @Action
    [userActions.removeUser](): void {
        this.context.commit(userMutations.removeUser)
    }
}
