import {Action, Module, Mutation, VuexModule} from "vuex-module-decorators";
import ProjectModel from "@/models/project.model";

@Module
export default class ProjectModule extends VuexModule {
    projectList: ProjectModel[] = [];

    get projectDetail() {
        return (projectId: number) => {
            this.projectList.find(project => project.id === projectId)
        }
    }

    @Mutation
    updateProjectList(newProjectList: ProjectModel[]): void {
        this.projectList = newProjectList;
    }

    @Action({commit: 'updateProjectList'})
    retrieveProjectList(): ProjectModel[] {
        return []
    }
}