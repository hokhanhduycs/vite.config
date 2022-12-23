export default class MiniMapItem {
    name = ''
    fullname = ''
    lock = false
    select = false
    visible = true
    children: Array<MiniMapItem> = []
    constructor(name?:string){
        this.name = name?name:'default'
        this.fullname = this.name
    }
    traverse(callback: (c: MiniMapItem)=>void,forceHidden?:boolean){
        for (const item of this.children) {
            if((item.lock || !item.visible) && !forceHidden){
                continue
            }

            callback(item)
            item.traverse(callback,forceHidden)
        }
    }
    render(_ctx: CanvasRenderingContext2D){
        if(!this.visible)
            return
    }
}