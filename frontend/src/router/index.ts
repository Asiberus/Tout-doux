import Vue from 'vue';
import VueRouter, {RouteConfig} from 'vue-router';
import {projectRoute} from "@/router/modules/project.router";
import {listRoute} from "@/router/modules/list.router";


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
    routes: [...routes, ...projectRoute, ...listRoute]
});

export default router;
