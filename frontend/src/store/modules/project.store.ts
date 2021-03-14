import {Action, Module, Mutation, VuexModule} from "vuex-module-decorators";
import ProjectModel from "@/models/project/project.model";
import {PriorityEnum} from "@/models/project/priority.enum";

@Module
export default class ProjectModule extends VuexModule {
    projectList: ProjectModel[] = [];

    get projectDetail() {
        return (projectId: string) => {
            this.projectList.find(project => project.id === projectId)
        }
    }

    @Mutation
    updateProjectList(newProjectList: ProjectModel[]): void {
        this.projectList = newProjectList;
    }

    @Action({commit: 'updateProjectList'})
    retrieveProjectList(): ProjectModel[] {
        return [
            {id: '1', name: 'Project 1', description: 'Project Description', priority: PriorityEnum.NORMAL, tasks: []},
            {id: '2', name: 'Project 2', description: 'Second Project Description', priority: PriorityEnum.IMPORTANT, tasks: []},
        ]
    }
}