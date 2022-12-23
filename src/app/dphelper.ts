const request = window.indexedDB.open('rapano', 1)
let db:IDBDatabase
request.onupgradeneeded = () => {
    db = request.result
    db.createObjectStore('minimap',{keyPath:'name'})
}
request.onerror = console.error
request.onsuccess = ()=>{
    db = request.result
}


export default class DBHelper {
    constructor() {
    }
    loadpoint(name:string){
        return new Promise((rel,rej)=>{
            const req = db.transaction('minimap',"readonly")
            .objectStore('minimap')
            .get(name)
            req.onsuccess = ()=>{
                rel(req.result)
            }
            req.onerror = ()=>{
                rej(req.error)
            }
        })
    }
    findpoint(query:string|null,count=1){
        return new Promise<any[]>((rel,rej)=>{
            const req = db.transaction('minimap',"readonly")
            .objectStore('minimap')
            .getAll(query,count)
            req.onsuccess = ()=>{
                rel(req.result)
            }
            req.onerror = ()=>{
                rej(req.error)
            }
        })
    }
    deletepoint(name:string){
        return new Promise((rel,rej)=>{
            const req = db.transaction('minimap',"readwrite")
            .objectStore('minimap')
            .delete(name)
            req.onsuccess = ()=>{
                rel(req.result)
            }
            req.onerror = ()=>{
                rej(req.error)
            }
        })
    }
    savepoint(item:any){
        return new Promise((rel,rej)=>{
            const req = db.transaction('minimap',"readwrite")
            .objectStore('minimap')
            .put(JSON.parse(JSON.stringify(item)))
            req.onsuccess = ()=>{
                rel(req.result)
            }
            req.onerror = ()=>{
                rej(req.error)
            }
        })
    }
    export(){
        const req = db.transaction('minimap',"readonly")
        .objectStore('minimap').getAll(null,1000)
        req.onsuccess = ()=>{
            const b = new Blob([JSON.stringify(req.result,null,2)])
            const a = document.createElement("a");
            a.href = URL.createObjectURL(b);
            a.download = 'report.json';
            a.click();
        }
        req.onerror = console.error
    }
}