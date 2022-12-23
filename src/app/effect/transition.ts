import TWEEN from '@tweenjs/tween.js'
import { Object3D,  Group, Vector3, Mesh, MeshBasicMaterial } from 'three';
import { Hotspot } from '../pano/hotspot';
import Pano from '../pano/pano';
import RenderConfig from '../renderconfig'
let fadeobj: Object3D
export default class TransitionEffect {
    constructor(domElement: HTMLElement) {
        this.domElement = domElement
        this.effectRoot = new Group()
    }
    effectRoot: Group
    domElement: HTMLElement
    isFinish=true
    onChanged:(()=>void)|null = null
    onFinish:(()=>void)|null = null
    fadeout(time = 1000) {
        const tweenval = { x: 0.00 };
        new TWEEN.Tween(tweenval)
            .to({ x: 1.00 }, time)
            .easing(TWEEN.Easing.Quadratic.In)
            // .easing(TWEEN.Easing.Cubic.In)
            .onStart(() => {
                fadeobj.traverse(x => {
                    if(x instanceof Mesh){
                        const m  = x .material as MeshBasicMaterial
                        m.transparent = true
                    }
                })
            })
            .onComplete(() => {
                if (fadeobj)
                    this.effectRoot.remove(fadeobj)
                this.isFinish = true
                // this.domElement.dispatchEvent(finishEvent)
                this.onFinish?.()
                // console.log('onComplete')
            })
            .onUpdate((val) => {
                const t = val.x
                fadeobj.traverse(x => {
                    if(x instanceof Mesh){
                        const m  = x .material as MeshBasicMaterial
                        m.opacity = 1 - t
                    }
                })
                this.onChanged?.()
            })
            .start()
    }
    move(center: Vector3, target: Object3D,meshobj: Object3D, time = 1000) {
        if (!target)
            return
        this.isFinish = false
        const v = center.clone()
        const pos = new Vector3(target.userData.pos.x, target.userData.pos.y, target.userData.pos.z)
        if (target.userData.type == 1) {
            pos.add(new Vector3(0, 0, RenderConfig.config.camHeight))
        }
        v.sub(pos)
        v.multiplyScalar(Math.pow(v.length(), 0.1) / v.length())
        v.set(-v.y,v.z,v.x)     
        fadeobj = meshobj.clone()
        fadeobj.traverse(x => {
            if(x instanceof Mesh){
                const m  = x .material as MeshBasicMaterial
                x.material = m.clone()
            }
            
        })
        this.effectRoot.add(fadeobj)
        fadeobj.scale.multiplyScalar(RenderConfig.config.transitionscale / RenderConfig.config.viewDistance)
        const tweenval = { x: 0 };
        let t = 0
        new TWEEN.Tween(tweenval)
            .to({ x: 1.00 }, time)
            // .easing(TWEEN.Easing.Quadratic.In)
            // .easing(TWEEN.Easing.Cubic.In)
            .onStart(() => {
                // console.log('onStart')
            })
            .onComplete(() => {
                this.fadeout()
            })
            .onUpdate((val) => {
                if(t != val.x){
                    t= val.x
                    fadeobj.position.copy(v.clone()).multiplyScalar(t)
                    this.onChanged?.()
                }
            })
            .start()
    }
    moveTo(pano: Pano, hp: Hotspot, time = 1000) {
        if (!hp)
            return
        this.isFinish = false
        const v = pano.pos.clone()
        const pos = hp.pos.clone()
        if (hp.type == 1) {
            pos.add(new Vector3(0, 0, RenderConfig.config.camHeight))
        }
        v.sub(pos)
        v.multiplyScalar(Math.pow(v.length(), 0.1) / v.length())
        v.set(-v.y,v.z,v.x)     
        fadeobj = pano.obj.clone()
        fadeobj.traverse(x => {
            if(x instanceof Mesh){
                const m  = x .material as MeshBasicMaterial
                x.material = m.clone()
            }
            
        })
        this.effectRoot.add(fadeobj)
        fadeobj.scale.multiplyScalar(RenderConfig.config.transitionscale / RenderConfig.config.viewDistance)
        const tweenval = { x: 0 };
        let t = 0
        new TWEEN.Tween(tweenval)
            .to({ x: 1.00 }, time)
            // .easing(TWEEN.Easing.Quadratic.In)
            // .easing(TWEEN.Easing.Cubic.In)
            .onStart(() => {
                console.log('onStart')
            })
            .onComplete(() => {
                this.fadeout()
            })
            .onUpdate((val) => {
                if(t != val.x){
                    t= val.x
                    fadeobj.position.copy(v.clone()).multiplyScalar(t)
                    this.onChanged?.()
                }
            })
            .start()
    }
}