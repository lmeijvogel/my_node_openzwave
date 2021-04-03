export class ConfigLight {
    readonly values: { [commandClass: string]: any }

    constructor(
        readonly id: number,
        readonly name: string,
        readonly displayName: string,
        values: { [commandClass: string]: any }
    ) {
        this.values = values || {};
    }
}
