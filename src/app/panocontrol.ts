import { Camera, Euler, MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import RenderConfig from './renderconfig'
let touchscaling = false
let touchlast = 0
export class PanoControls extends OrbitControls {
    isLimit: boolean
    onChanged:(()=>void)|null = null
    constructor(object: Camera, domElement?: HTMLElement) {
        super(object, domElement)
        object.position.set(0, 0, 0.01)
        this.enableDamping = false
        this.enableZoom = false
        this.rotateSpeed = -RenderConfig.config.fov / 360
        // this.rotateSpeed = -this.options.defaultfov/360
        // const v = 2 * Math.atan( Math.tan(this.options.defaultfov*Math.PI/180 / 2) * this.element.clientWidth/this.element.clientHeight)/Math.PI*180
        // console.log(this.options.defaultfov)
        // console.log(v)
        // this.rotateSpeed = -v/this.element.clientWidth*this.element.clientHeight/360
        this.minPolarAngle = Math.PI * 0.1; // radians
        this.maxPolarAngle = Math.PI * 0.9; // radians
        this.isLimit = false
        this.domElement.addEventListener("touchstart", (event) => this.onTouchStartZoom(event as TouchEvent));
        this.domElement.addEventListener("touchmove", (event) => this.onTouchMoveZoom(event as TouchEvent));
        this.domElement.addEventListener("touchend", () => this.onTouchEndZoom());
        this.domElement.addEventListener( 'wheel', (event: Event)=>this.onMouseWheel(event as WheelEvent) );
    }

    //limit view around base rot with ranger in radian default is PI/4
    limitViewForward(rot: Vector3|undefined,range=Math.PI / 4) {

        //release limit
        this.minAzimuthAngle = -Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians

        this.isLimit = !!rot
        //limit hozirontal rot +- 45 degree
        if (rot) {
            const v = new Vector3(0, 0, -0.1);
            v.applyEuler(new Euler(-rot.y*Math.PI/180,0,0))
            v.applyEuler(new Euler(0,(360- rot.z)*Math.PI/180, 0))
            this.object.position.set(v.x, v.y, v.z)
            this.update()
            const y = this.getAzimuthalAngle();
            let min = y - range;
			let max = y + range;
            const twoPI = 2 * Math.PI;
            if ( min < - Math.PI ) min += twoPI; else if ( min > Math.PI ) min -= twoPI;
			if ( max < - Math.PI ) max += twoPI; else if ( max > Math.PI ) max -= twoPI;
            this.minAzimuthAngle = min; // radians
            this.maxAzimuthAngle = max; // radians
        }
    }
    lookAt(pos:Vector3){
        const v = new Vector3().sub(pos)
        v.multiplyScalar(0.1/v.length())
        this.object.position.copy(v)
        this.update()
    }
    testRot(y:number,z:number){
        const v = new Vector3(0, 0, -0.1);
        v.applyEuler(new Euler(-y*Math.PI/180,0,0))
        v.applyEuler(new Euler(0,(360- z)*Math.PI/180, 0))
        this.object.position.copy(v)
        this.update()
    }
    setDefaultRot(rot: Vector3){
        //release limit
        this.minAzimuthAngle = -Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians
        const v = new Vector3(0, 0, -0.1);
        v.applyEuler(new Euler(-rot.y*Math.PI/180,0,0))
        v.applyEuler(new Euler(0,(360- rot.z)*Math.PI/180, 0))
        this.object.position.copy(v)
        this.update()

    }
    onMouseWheel(event: WheelEvent){
        if(!RenderConfig.config.canZoom)
            return
        const cam = (this.object as PerspectiveCamera)
        let fov = cam.fov
        fov += event.deltaY > 0 ? 1 : -1
        this.updateZoom(fov)

    }
    onTouchStartZoom(event: TouchEvent) {
        if(!RenderConfig.config.canZoom)
            return
        if (event.touches.length == 2) {
            touchscaling = true
            touchlast = Math.hypot(
                event.touches[0].pageX - event.touches[1].pageX,
                event.touches[0].pageY - event.touches[1].pageY);
        }
    }
    onTouchMoveZoom(event: TouchEvent) {
        if(!RenderConfig.config.canZoom)
            return
        const cam = (this.object as PerspectiveCamera)
        if (event.touches.length == 2 && touchscaling) {
            const dist = Math.hypot(
                event.touches[0].pageX - event.touches[1].pageX,
                event.touches[0].pageY - event.touches[1].pageY);
            let fov = cam.fov
            if (dist - touchlast > 10) {
                fov += 1
                touchlast = dist
            }
            else if (dist - touchlast < -10) {
                fov -= 1
                touchlast = dist
            }
            this.updateZoom(fov)
        }
    }
    updateZoom(z:number){
        if(!RenderConfig.config.canZoom)
            return
        const cam = (this.object as PerspectiveCamera)
        cam.fov = MathUtils.clamp(z, RenderConfig.config.minZoom, RenderConfig.config.maxZoom)
        cam.updateProjectionMatrix();
        this.onChanged?.()
    }
    onTouchEndZoom() {
        if(!RenderConfig.config.canZoom)
            return
        if (touchscaling) {
            touchscaling = false;
        }
    }

}

