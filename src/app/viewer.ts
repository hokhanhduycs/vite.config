import { PanoControls } from './panocontrol';
import { Frustum, WebGLRenderer, PerspectiveCamera, Vector2, Scene } from 'three';
import Pano from './pano/pano'
import HotspotManager from './pano/hotspotmanager';
import TWEEN from '@tweenjs/tween.js'
import assets from './assets';
import { loadAssets } from './assetmanger';
import RenderConfig from './renderconfig';
import { Hotspot } from './pano/hotspot';
import { VRButton } from "three/examples/jsm/webxr/VRButton";
let autorotateTimeout: number
let autorotateStart:()=>void
let autorotateEnd:()=>void
function drawStroked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
    ctx.font = '3em Sans-serif';
    ctx.shadowColor = '#e65a3e';
    ctx.strokeStyle = '#e65a3e';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 7;
    ctx.lineWidth = 6;
    ctx.strokeText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.fillText(text, x, y);
}
function saveblobfile(blob: Blob, fileName: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
}

export default class PanoViewer {
    element: HTMLElement
    camera: PerspectiveCamera
    renderer: WebGLRenderer
    controls: PanoControls
    frustum: Frustum
    pano: Pano
    scene: Scene
    hotspotManager: HotspotManager
    private rotZ = 1000
    onRequestLoadPano: ((hp: Hotspot) => void) | null = null
    onChangeRot: ((z: number) => void) | null = null
    onChangeHotspot: ((ls: Array<Hotspot>) => void) | null = null
    onChangeClickable: ((ls: boolean) => void) | null = null
    constructor(element: HTMLElement, opt?: RenderConfig) {
        console.log('init ra pano')
        Object.assign(RenderConfig.config, opt)
        this.element = element;
        this.camera = new PerspectiveCamera(RenderConfig.config.fov, 1, 0.01, RenderConfig.config.viewDistance * 3.14 * 2);

        this.renderer = new WebGLRenderer({ antialias: true });
        if('xr' in window.navigator){
            this.renderer.xr.enabled = true
            document.body.appendChild( VRButton.createButton( this.renderer ) );
        }

        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.element.appendChild(this.renderer.domElement);
        this.resize();
        this.controls = new PanoControls(this.camera, this.element);
        if (RenderConfig.config.autorotdelay > 300) {
            autorotateStart = () => {
                autorotateTimeout = window.setTimeout(() => {
                    this.controls.autoRotate = true;
                }, RenderConfig.config.autorotdelay);
            }
            autorotateEnd = ()=>{
                window.clearTimeout(autorotateTimeout);
                this.controls.autoRotate = false;
            }
            autorotateStart()
            this.controls.addEventListener('start', autorotateEnd);
            // restart autorotate after the last interaction & an idle time has passed
            this.controls.addEventListener('end', autorotateStart)

        }
        this.frustum = new Frustum();
        this.hotspotManager = new HotspotManager(this.camera, this.element)


        this.hotspotManager.onRequestLoadPano = (hp) => this.onRequestLoadPano?.(hp)
        this.hotspotManager.onChangeClickable = (b) => {
            if (b)
                element.classList.add('hotspot-clickable')
            else
                element.classList.remove('hotspot-clickable')
        }


        window.addEventListener('resize', () => {
            this.resize();
            this.render()
        });

        window.addEventListener('orientationchange', () => {
            this.resize();
            this.render()
        });
        this.scene = new Scene()
        this.pano = new Pano(this.camera)
        this.pano.setMaxAnisotropy(this.renderer.capabilities.getMaxAnisotropy())
        this.scene.add(this.pano.obj)
        this.scene.add(this.hotspotManager.obj)


        this.renderer.setAnimationLoop((t)=>this.animate(t))
        // requestAnimationFrame((t) => this.animate(t));
    }
    async init() {
        return new Promise((reslove, _reject) => {
            loadAssets('', assets, () => {
                this.hotspotManager.init()
                reslove('')
            })
        })
    }
    settime(t:string){
        RenderConfig.config.time = t;
    }
    async loadPanoById(id: string, firstload?: boolean) {
        const data = await fetch(`${RenderConfig.config.baseUrl}/pano/${id}.json`).then(res => res.json())
        this.loadPano(data,firstload)
        return data
    }
    zoomIn(z = 1) {
        this.controls.updateZoom(this.camera.fov - z)
    }
    zoomOut(z = 1) {
        this.controls.updateZoom(this.camera.fov + z)
    }
    autoRot(b: boolean) {
        this.controls.autoRotate = b
    }
    async loadPano(panodata: any, firstload?: boolean) {

        this.pano.loadPano(panodata)
        this.hotspotManager.load(this.pano)
        if (firstload) {
            this.controls.setDefaultRot(panodata.rot)
        }
        this.controls.limitViewForward(panodata.limitview ? panodata.rot : null)
        this.rotZ = this.controls.getAzimuthalAngle()
        this.onChangeRot?.(this.rotZ)
    }
    animate(t: number) {

        TWEEN.update(t)
        this.controls.update()
        this.render()
    }
    resize(si?: Vector2) {
        const v = new Vector2()
        this.renderer.getSize(v)
        if (!si)
            si = new Vector2(this.element.offsetWidth, this.element.offsetHeight)
        if (v.x == si.x && v.y == si.y)
            return
        this.camera.aspect = si.x / si.y;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(si.x, si.y);
    }
    render() {

        // this.transition.render()
        this.renderer.render( this.scene, this.camera );
        if (this.pano)
            this.pano.update()
        if (!this.pano.lowReady) {
            return
        }

        const z = this.controls.getAzimuthalAngle()
        //revert rot
        if(this.controls.autoRotate && this.controls.isLimit && (z== this.controls.minAzimuthAngle || z== this.controls.maxAzimuthAngle)){
            this.controls.autoRotateSpeed *= -1
        }
        if (this.rotZ != z) {
            this.rotZ = z
            this.onChangeRot?.(z)
        }
        this.onChangeHotspot?.(this.hotspotManager.getinfopos())
    }
    capturescreen(savefile = true, label?: Array<string>) {
        const v = new Vector2()
        this.renderer.getSize(v)
        const nv = new Vector2(this.element.clientWidth, this.element.clientHeight).multiplyScalar(window.devicePixelRatio)
        this.resize(nv)
        this.render()
        //this.renderer.render(this.scene, this.camera);
        let b: Blob | null = null
        if (label && label.length) {
            const tmp = document.createElement('canvas');
            tmp.width = nv.x
            tmp.height = nv.y
            const ctx = tmp.getContext('2d')
            if (ctx) {
                ctx.drawImage(this.renderer.domElement, 0, 0, nv.x, nv.y)
                for (let index = 0; index < label.length; index++) {
                    drawStroked(ctx, label[index], 20, 60 * index + 50)
                }
            }
            tmp.toBlob((blob: any) => {
                b = blob
            }, 'image/jpeg', 0.95);
        } else {
            this.renderer.domElement.toBlob((blob: any) => {
                b = blob
            }, 'image/jpeg', 0.95);
        }
        this.resize(v)
        this.render()
        //this.renderer.render(this.scene, this.camera);
        console.log(!!b)
        if (savefile && b)
            saveblobfile(b, 'screencapture.jpg');
        return b
    }
}