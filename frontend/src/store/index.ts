import { CollectionModule } from '@/store/modules/collection.store'
import { ProjectModule } from '@/store/modules/project.store'
import { PreferencesModule } from '@/store/modules/preferences.store'
import Vue from 'vue'
import Vuex from 'vuex'
import { UserModule } from '@/store/modules/user.store'

Vue.use(Vuex)

export default new Vuex.Store({
    strict: process.env.NODE_ENV !== 'production',
    state: {},
    modules: {
        user: UserModule,
        preferences: PreferencesModule,
        project: ProjectModule,
        collection: CollectionModule,
    },
})
