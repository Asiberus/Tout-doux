import { collectionActions, CollectionModule } from '@/store/modules/collection.store'
import { projectActions, ProjectModule } from '@/store/modules/project.store'
import { preferencesActions, PreferencesModule } from '@/store/modules/preferences.store'
import Vue from 'vue'
import Vuex from 'vuex'
import { userActions, UserModule } from '@/store/modules/user.store'
import { StoreInterface } from '@/store/store.interface'

Vue.use(Vuex)

export default new Vuex.Store<StoreInterface>({
    strict: process.env.NODE_ENV !== 'production',
    modules: {
        user: UserModule,
        preferences: PreferencesModule,
        project: ProjectModule,
        collection: CollectionModule,
    },
    actions: {
        init({ dispatch }) {
            return Promise.all([
                dispatch(userActions.getUser),
                dispatch(preferencesActions.getPreferences),
            ])
        },
        exit({ dispatch }) {
            return Promise.all([
                dispatch(userActions.removeUser),
                dispatch(preferencesActions.removePreferences),
                dispatch(projectActions.removeCurrentProject),
                dispatch(collectionActions.removeCurrentCollection),
            ])
        },
    },
})
