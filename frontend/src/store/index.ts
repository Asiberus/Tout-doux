import { CollectionModule } from '@/store/modules/collection.store'
import { ProjectModule } from '@/store/modules/project.store'
import { PreferencesModule } from '@/store/modules/preferences.store'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    strict: process.env.NODE_ENV !== 'production',
    state: {},
    modules: {
        preferences: PreferencesModule,
        project: ProjectModule,
        collection: CollectionModule,
    },
})
