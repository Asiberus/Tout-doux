import {environment} from "@/environments/environment.dev";
import Vue from "vue";
import ProjectModel from "@/models/project/project.model";

const getProjectList = (params = {}) => {
    return Vue.http.get(environment.project, {params});
};

const getProjectById = (projectId: number) => {
    return Vue.http.get(environment.projectById.replace(':projectId', projectId.toString()));
};

const createProject = (project: Partial<ProjectModel>) => {
    return Vue.http.post(environment.project, project);
};

const updateProject = (projectId: number, project: Partial<ProjectModel>) => {
    return Vue.http.patch(environment.projectById.replace(':projectId', projectId.toString()), project);
};

export const projectService = {
    getProjectList,
    getProjectById,
    createProject,
    updateProject
};