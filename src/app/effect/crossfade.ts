import { LinearFilter, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, PerspectiveCamera, PlaneGeometry, RGBFormat, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget } from "three"
import TWEEN, { Tween } from '@tweenjs/tween.js'
import { Hotspot } from "../pano/hotspot"
import Pano from "../pano/pano"
import RenderConfig from "../renderconfig"

class FXScene{
    fbo:WebGLRenderTarget
    renderer:WebGLRenderer  
    scene:Scene
    camera:PerspectiveCamera 
    constructor(renderer: WebGLRenderer,camera:PerspectiveCamera){
        this.renderer = renderer
        this.scene = new Scene();
        this.camera = camera
        const renderTargetParameters = { minFilter: LinearFilter, magFilter:LinearFilter, format: RGBFormat };
		this.fbo = new WebGLRenderTarget( window.innerWidth, window.innerHeight, renderTargetParameters );
    }
    cleanMaterial(material:MeshBasicMaterial){
        material.dispose()
        material.map?.dispose()
    }
    cleanObj(obj:Object3D){
        obj.traverse(x => {
            if(x instanceof Mesh)
            
            if (x.material) {
                this.cleanMaterial(x.material as MeshBasicMaterial)
            }
        })
    }
    clear(){
        this.cleanObj(this.scene)
    }
    render(rtt:boolean){
        // console.log(this.scene.children[0].children.length)
        // this.renderer.setClearColor( this.clearColor );
        if ( rtt ) {
            this.renderer.setRenderTarget( this.fbo );
            this.renderer.clear();
            this.renderer.render( this.scene, this.camera );

        } else {
            this.renderer.setRenderTarget( null );
            this.renderer.render( this.scene, this.camera );

        }
    }
}
const fadematerial = new ShaderMaterial( {
    uniforms: {
        tDiffuse1: {
            value: null
        },
        tDiffuse2: {
            value: null
        },
        mixRatio: {
            value: 0.0
        }
    },
    vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        'vUv = vec2( uv.x, uv.y );',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'

    ].join( '\n' ),
    fragmentShader: [
        'uniform float mixRatio;',
        'uniform sampler2D tDiffuse1;',
        'uniform sampler2D tDiffuse2;',
        'varying vec2 vUv;',
        'void main() {',
        '	vec4 texel1 = texture2D( tDiffuse1, vUv );',
        '	vec4 texel2 = texture2D( tDiffuse2, vUv );',
        '		gl_FragColor = mix( texel2, texel1, mixRatio );',
        '}'

    ].join( '\n' )

} );

class TransitionParams {
    'transition'= 1
}
let currPano: Pano
let fadeobj: Object3D
let moveTarget:Vector3
class Transition{
    renderer:WebGLRenderer    
    sceneA:FXScene
    sceneB:FXScene
    scene:Scene
    camera:OrthographicCamera
    fadetween: Tween<TransitionParams>
    movetween: Tween<TransitionParams>
    transitionParams = new TransitionParams()
    moveParams = new TransitionParams()
    onComplete:(()=>void)|null=null
    isRunning = false
    constructor(renderer: WebGLRenderer,camera:PerspectiveCamera){
        this.renderer = renderer
        const size = new Vector2()
        renderer.getSize(size)
        this.scene = new Scene();
        this.sceneA = new FXScene(renderer,camera)
        this.sceneB = new FXScene(renderer,camera)
        this.camera = new OrthographicCamera( size.x / - 2, size.x / 2, size.y / 2, size.y / - 2, - 10, 10 );
        const geometry = new PlaneGeometry( window.innerWidth, window.innerHeight );
        const mesh = new Mesh( geometry, fadematerial );
        this.scene.add( mesh );

        fadematerial.uniforms.tDiffuse1.value = this.sceneA.fbo.texture;
        fadematerial.uniforms.tDiffuse2.value = this.sceneB.fbo.texture;
        
        this.fadetween = new TWEEN.Tween( this.transitionParams ).to( { transition: 1 }, 1500 ).onStart(()=>{
            this.sceneA.render( true );
            this.sceneB.render( true );
            
            // if(fadeobj){
            //     this.sceneB.scene.remove(fadeobj)
            // }
            // currPano.clear()
        }).onComplete(()=>{
            this.isRunning = false
            this.sceneB.clear();
            this.onComplete?.()
        })
        this.movetween = new TWEEN.Tween( this.moveParams ).to( { transition: 1 }, 1500 ).onComplete(()=>{
            this.fadetween.start()
        })
            // .repeat( Infinity )
            // .delay( 2000 )
            // .yoyo( true )
            // .start();

				
    }
    fadeTo(pano: Pano){
        currPano = pano
        moveTarget = pano.pos.clone()
        
        fadeobj = pano.roomMesh.clone()
        this.sceneB.scene.add(fadeobj)
        this.transitionParams.transition = 0
        this.fadetween.start()
        this.isRunning = true
    }
    moveTo(pano: Pano, hp: Hotspot,movetime=1500,fadetime=1500) {
        currPano = pano
        moveTarget = pano.pos.clone()
        const pos = hp.pos.clone()
        // if (hp.type == 1) {
        //     pos.add(new Vector3(0, 0, RenderConfig.config.camHeight))
        // }
        moveTarget.sub(pos)
        moveTarget.multiplyScalar(RenderConfig.config.transitionscale )
        moveTarget.set(-moveTarget.y,moveTarget.z,moveTarget.x)     
        // const time = moveTarget.length()*1000
        // const time = 1500
        // moveTarget.set(moveTarget.y,moveTarget.z,-moveTarget.x)   
        // if(fadeobj)
        //     this.sceneB.scene.remove(fadeobj)
        fadeobj = pano.roomMesh.clone()
        this.sceneB.scene.clear()
        this.sceneB.scene.add(fadeobj)
        this.movetween.duration(movetime)
        this.moveParams.transition = 0
        this.transitionParams.transition = 0
        this.fadetween.duration(fadetime)
        this.movetween.start()
        this.isRunning = true
    }
    
    render ( ) {
        // Transition animation
        // TWEEN.update();

        fadematerial.uniforms.mixRatio.value = this.transitionParams.transition;
        if(currPano && this.moveParams.transition!=1 && this.moveParams.transition!=0){
            fadeobj.position.copy(moveTarget.clone()).multiplyScalar(this.moveParams.transition)
        }
        // Prevent render both scenes when it's not necessary
        if ( this.transitionParams.transition == 0 ) {

            this.sceneB.render( false );

        } else if ( this.transitionParams.transition == 1 ) {
            this.sceneA.render( false );

        } else {
            // When 0<transition<1 render transition between two scenes
            this.sceneA.render( true );
            // this.sceneB.render( true );
            this.renderer.setRenderTarget( null );
            this.renderer.clear();
            this.renderer.render( this.scene, this.camera );
        }

    }
}
export {FXScene,Transition}