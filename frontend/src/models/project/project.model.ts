import TaskModel from "@/models/task/task.model";
import {PriorityEnum} from "@/models/project/priority.enum";

export default interface ProjectModel {
    id: string;
    title: string;
    description: string;
    tasks: TaskModel[];
    priority: PriorityEnum;
}