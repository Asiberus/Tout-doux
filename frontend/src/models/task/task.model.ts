import ProjectModel from "@/models/project/project.model";
import {PriorityEnum} from "@/models/project/priority.enum";
import ListModel from "@/models/project/list.model";

export default interface TaskModel {
    id: string;
    name: string;
    description?: string;
    completed: boolean;
    priority: PriorityEnum;
    project?: ProjectModel;
    list?: ListModel;
    deadline?: string;
    event: boolean;
}