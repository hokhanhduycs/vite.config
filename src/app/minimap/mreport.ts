import { Vector3 } from "three"

export default class MiniMapReport{
    name = ''
    fullname = ''
    guid = ""
    pos = new Vector3()
    profile = ''
    reports:Array<any> = []
    status = 0
    constructor(){

    }
}