import {PriorityEnum} from "@/models/project/priority.enum";
import {TaskDisplayModel} from "@/models/task/task.model";

export default interface ProjectModel {
    id: number;
    name: string;
    description: string;
    tasks: TaskDisplayModel[];
    priority: PriorityEnum;
}