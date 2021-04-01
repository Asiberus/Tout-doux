import {PriorityEnum} from "@/models/priority.enum";
import {TaskModel} from "@/models/task.model";

export interface DailyTaskModel {
    id: number;
    date: string;
    taskId?: number;
    name?: string;
    priority?: PriorityEnum;
    action?: DailyTaskActionEnum;
    completed: boolean;

    task: TaskModel;
}

export enum DailyTaskActionEnum {
    THINK = 'TH',
    WORK = 'WO',
    FINISH = 'FI'
}