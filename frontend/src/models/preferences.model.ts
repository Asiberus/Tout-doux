export enum ProgressWheelMode {
    Percent = 'percent',
    Number = 'number',
}

export interface Preferences {
    progressWheelMode: ProgressWheelMode
}
