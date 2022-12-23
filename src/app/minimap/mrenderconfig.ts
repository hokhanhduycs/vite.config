export default class MRenderConfig {
    static config = new MRenderConfig()
    runtime = false
    link = 'showlinkonlyselect'
    linkColor = 'green'
    radius = 4
    borderRadius = 2
    border = 'select'
    color = 'blue'
    colorError = 'red'
    colorDisable = 'black'
    borderColor = 'white'
    isCustomColor = false
    customColor=['yellow','red','blue']
    canSelect = true
    canPan = true
    canZoom = true
    baseUrl = ''
    camera: {
        path: string,
        transform: {
            x: number,
            y: number,
            width: number,
            heigh: number,
            r: number //angle in degree from down axis to forward 
        }
    } | null = null
}