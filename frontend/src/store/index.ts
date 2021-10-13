import Vue from 'vue'
import Vuex from 'vuex'
import ProjectModule from "@/store/modules/project.store";

Vue.use(Vuex);

export default new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {},
  modules: {
    project: ProjectModule,
  },
})
