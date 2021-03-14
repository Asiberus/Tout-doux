import {environment} from "@/environments/environment.dev";
import Vue from "vue";

const getProjectList = () => {
    return Vue.http.get(environment.project);
};

const getProjectById = (projectId: string) => {
    return Vue.http.get(environment.projectById.replace(':projectId', projectId));
};

export const projectService = {
    getProjectList,
    getProjectById
};