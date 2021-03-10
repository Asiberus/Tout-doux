import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import projectRoute from '@/router/modules/project.router';

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [...routes, ...projectRoute]
});

export default router;
