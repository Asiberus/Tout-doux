import Vue from 'vue'
import Vuex from 'vuex'
import ProjectModule from "@/store/modules/project.store";


Vue.use(Vuex)

export default new Vuex.Store({
  state: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    project: ProjectModule
  }
})


