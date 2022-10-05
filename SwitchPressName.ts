export enum SwitchPressName {
  Unknown = "Unknown",
  SceneReturn = "SceneReturn", // This always follows a scene event
  SingleOff = "SingleOff",
  SingleOn = "SingleOn",
  Double = "Double",
  HoldOn = "HoldOn",
  HoldOff = "HoldOff"
};


export function mainSceneIdToSwitchPressName(sceneId: number): SwitchPressName {
    switch (sceneId) {
        case 0:
            return SwitchPressName.SceneReturn;
        case 10:
            return SwitchPressName.SingleOn;
        case 11:
            return SwitchPressName.SingleOff;
        case 14:
            return SwitchPressName.Double; // This is the same for up and down
        case 17:
            return SwitchPressName.HoldOn;
        case 18:
            return SwitchPressName.HoldOff;
        default:
            return SwitchPressName.Unknown;
    }
}

export function switchPressNameToSceneId(switchPressName: string): number {
    switch(switchPressName) {
        case "SceneReturn":
            return 0;
        case "SingleOn":
            return 10;
        case "SingleOff":
            return 11;
        case "Double": // This is the same for up and down
            return 14;
        case "HoldOn":
            return 17;
        case "HoldOff":
            return 18;
        default:
            return 0;
    }

}
