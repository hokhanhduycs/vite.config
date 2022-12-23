import { Object3D, Vector2, Vector3 } from "three"
export const HotspotType = {
    ground:1,
    air:2,
    info:3,
    virtual:99
}


export class Hotspot{
    name=''
    fullname=''
    pos = new Vector3()
    pos2d = new Vector2()
    type = HotspotType.ground
    obj : Object3D|null = null
    el:HTMLElement
    constructor(data?:any){
        if(data && data.pos2d)
            data.pos2d = new Vector2(data.pos2d.x,data.pos2d.y)
        Object.assign(this,data)
        this.el = document.createElement('div')
        this.el.classList.add('pano-hotspot')
        this.el.innerHTML = '<img src="imgs/hotspot.svg"/>'
    }
}