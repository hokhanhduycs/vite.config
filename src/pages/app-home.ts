import { LitElement, css, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';

// For more info on the @pwabuilder/pwainstall component click here https://github.com/pwa-builder/pwa-install
import '@pwabuilder/pwainstall';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import { styles } from '../styles/shared-styles';
import PanoViewer from '../app/viewer'
import RenderConfig from '../app/renderconfig';
import MRenderConfig from '../app/minimap/mrenderconfig';
import MiniMapScene from '../app/minimap/mscene';
import { Hotspot } from '../app/pano/hotspot';
const baseUrl = '.',
allhotspot:Array<Hotspot> = []
let viewer:PanoViewer,
minimap:MiniMapScene, curr:Hotspot
@customElement('app-home')
export class AppHome extends LitElement {

  // For more information on using properties and state in lit
  // check out this link https://lit.dev/docs/components/properties/
  @property() message = 'Welcome!';

  static get styles() {
    return [
      styles,
      css`
        .app3d {
          position: fixed;
          top: 0;
          right: 0;
          left: 0;
          bottom: 0;
        }

        .app3d.hotspot-clickable {
          cursor: pointer;
        }

        .mini-map {
          position: fixed;
          right: 0;
          bottom: 0;
          width: 300px;
          height: 300px;
          background-color: #faebd77a;
          border-radius: 50px 0 0 0;
          transition: right 2s ease 0s;
        }


        #hotspot-info {
          pointer-events: none;
        }

        .pano-hotspot {
          position: absolute;
          width: 72px;
          height: 72px;
        }

        .mini-map-close{
          width: 24px;
          height: 100%;
          position: absolute;
          z-index: 100;
          display: flex;
          align-items: center;
        }
        .mini-map-close img{
          width: 100%;
        }
        .mini-map.mini {
          right: -280px;
        }
        .mini-map.mini .mini-map-close-left{
          display: none
        }
        .mini-map .mini-map-close-left{
          display: inherit
        }
        .mini-map.mini .mini-map-close-right{
          display: inherit
        }
        .mini-map .mini-map-close-right{
          display: none
        }
    `];
  }

  constructor() {
    super();
  }

  async firstUpdated() {
    // this method is a lifecycle even in lit
    // for more info check out the lit docs https://lit.dev/docs/components/lifecycle/
    console.log('This is your home page');
    console.log(this.shadowRoot);
    const el = this.shadowRoot?.getElementById('streetview') as HTMLElement
    const mel = this.shadowRoot?.getElementById('mini-map') as HTMLElement
    const hel = this.shadowRoot?.getElementById('hotspot-info') as HTMLElement
    const cel = this.shadowRoot?.getElementById('mini-map-close') as HTMLElement
    cel.onclick = ()=>{
      mel.classList.toggle("mini")
    }

    const opt = {
      projectId: '61ea54ed25',
      canZoom: true,
      baseUrl: baseUrl,
      updateOnChange: false,
    } as RenderConfig


    viewer = new PanoViewer(el, opt)

    const minimapopt = {
      baseUrl: baseUrl,
      runtime: true,
      border: 'all',
      colorError: '#F0A155',
      radius: 6,
      borderRadius: 2,
      canSelect: false,
      canPan: false,
      canZoom: false,
      camera: {
        path: 'imgs/field.svg',
        transform: {
          x: 48,
          y: 70,
          width: 96,
          height: 96,
          r: 0
        }
      }
    } as unknown as MRenderConfig
    minimap = new MiniMapScene(mel, minimapopt)
    // mel.append(cel)
    minimap.load('1')
    viewer.init().then(() => {
      this.loadPanoById('apartment_8_ua_1_FL_35', true)
    })
    viewer.onRequestLoadPano = (hp) => {
      this.loadPanoById(hp.name)
    }
    viewer.onChangeRot = (z) => {
      if (curr)
        minimap.updateCam(curr.pos, z);
    };
    // const allhotspot = []
    viewer.onChangeHotspot = (ls) => {
      for (const hp of allhotspot) {
        hp.el.style.display = `none`
      }
      for (const item of ls) {
        let hp = allhotspot.find(x => x.name == item.name)
        if (!hp) {
          hp = item
          allhotspot.push(item)
          hel.appendChild(item.el)
        }
        hp.el.style.top = `${item.pos2d.y - 36}px`
        hp.el.style.left = `${item.pos2d.x - 36}px`
        hp.el.style.display = ``
      }

    };
    minimap.onclick = (hp) => {
      this.loadPanoById(hp.name)
    };

    console.log(el);
  }
  loadPanoById(id: string, firstload = false) {
    fetch(`${baseUrl}/pano/${id}.json`)
      .then(res => res.json())
      .then(res => {
        curr = res
        for (const hp of res.links) {
          hp.type = 3
        }
        return viewer.loadPano(res, firstload)
      })
      .catch(console.log)
  }
  share() {
    if ((navigator as any).share) {
      (navigator as any).share({
        title: 'PWABuilder pwa-starter',
        text: 'Check out the PWABuilder pwa-starter!',
        url: 'https://github.com/pwa-builder/pwa-starter',
      });
    }
  }

  render() {
    return html`

      <main>
        <div id="streetview" class="app3d">
          <div id="hotspot-info"></div>
          </div>
        <div id="mini-map" class="mini-map mini">
          <div id="mini-map-close" class="mini-map-close">
            <img class="mini-map-close-left" src="imgs/double_arrow_right.svg">
            <img class="mini-map-close-right" src="imgs/double_arrow_left.svg">
          </div>
        </div>
      </main>
    `;
  }
}
