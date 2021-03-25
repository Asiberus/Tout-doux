import {PriorityEnum} from "@/models/priority.enum";
import {TaskDisplayModel} from "@/models/task.model";

export default interface ProjectModel {
    id: number;
    name: string;
    description: string;
    priority: PriorityEnum;
    archived: boolean;
    tasks: TaskDisplayModel[];
    created_at: string;
}