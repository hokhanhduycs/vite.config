import { TextureLoader } from "three";
const textureloader = new TextureLoader()
function getLoadedCount(assets: any) {
    let count = 0;
    for (const i in assets) {
        if (assets[i].loading !== true) { count++; }
    }
    return count;
}
function allAssetsLoaded(assets: any) {
    for (const i in assets) {
        if (assets[i].loading === true) { return false; }
    }
    return true;
}
export function loadAssets(basePath: string, assets: any, onComplete: () => void, onProgress?: (f: number) => void) {
    if (basePath && basePath[basePath.length - 1] != '/') {
        basePath += '/';
    }
    for (const i in assets) {
        const obj = (assets as any)[i]
        const assetPath = obj.url;
        obj.loading = true;
        textureloader.load(basePath + assetPath, asset => {
            obj.texture = asset
            obj.loading = false
            if (onProgress) { onProgress(getLoadedCount(assets)) }
            if (onComplete && allAssetsLoaded(assets)) { onComplete(); }
        }, () => {
            /* on progress */
        },
            (e) => {
                console.error('Error loading asset', e);
            }
        );
    }
}