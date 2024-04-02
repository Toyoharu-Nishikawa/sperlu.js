import SUPERLU from "./superlu.js"
export {default as SUPERLU} from "./superlu.js"

//import Package from "./package.json" assert { type: "json" }

//export const version = Package.version
export const version = "SuperLU version 6.0.1"

export const superLU = async () => {
  const superlu = await SUPERLU()

  const func = {
    init(){
      const slu = new SLU(superlu)
      return slu 
    },
    fromMatrix(matrix){
      const slu = new SLU(superlu)
      slu.setMatrix(matrix)
      return slu 
    },
    fromCCS(m,n,nnz,a,asub,xa){
      const slu = new SLU(superlu)
      slu.setCCS(m,n,nnz,a,asub,xa)
      return slu 
    }
  }
  return func 
}

export const superLUWithWorker = async () => {
  const path = import.meta.url.split("/").slice(0,-1).join("/")
  const worker = new Worker(path+"/worker.js",{type:"module"})

  const func = {
    init(){
      const slu = new SLUW(worker)
      return slu
    },
    fromMatrix(matrix){
      const slu = new SLUW(worker)
      slu.setMatrix(matrix)
      return slu
    },
    fromCCS(m,n,nnz,a,asub,xa){
      const slu = new SLUW(worker)
      slu.setCCS(m,n,nnz,a,asub,xa)
      return slu
    },
  }
  return func
}


const SLU = class{
  constructor(superlu){
    this.superlu = superlu
    this.m = null
    this.n = null
    this.nnz = null
    this.nrhs = null
    this.a =[]
    this.asub =[]
    this.xa =[]
    this.rhs =[]
    this.matrix = null 
  }
  get CCS(){
    const m    = this.m 
    const n    = this.n 
    const nnz  = this.nnz  
    const a    = this.a 
    const asub = this.asub 
    const xa   = this.xa 
    const obj  = {m, n, nnz, a, asub,xa }
    return obj
  }
  set CCS(obj){
    this.m = obj.m
    this.n = obj.n
    this.nnz = obj.nnz
    this.a = obj.a
    this.asub = obj.asub
    this.xa = obj.xa
  }
  clear(){
    this.m       = null
    this.n       = null
    this.nnz     = null
    this.a       = null
    this.asub    = null
    this.xa      = null
    this.nrhs    = null
    this.rhs     = null
    this.matrix  = null

    return this
  }
  release(){
    this.superlu = null
    this.m       = null
    this.n       = null
    this.nnz     = null
    this.a       = null
    this.asub    = null
    this.xa      = null
    this.nrhs    = null
    this.rhs     = null
    this.matrix  = null

    return this
  }
  setMatrix(A){
    this.matrix = A
    this.setCCSFromMatrix(A)

    return this
  }
  setCCS(m,n,nnz,a,asub,xa){
    this.m = m
    this.n = n
    this.nnz = nnz
    this.a = a
    this.asub = asub
    this.xa = xa

    return this
  }
  setRHS(B){
    if(!Array.isArray(B)){
      return
    }
    if(Array.isArray(B[0])){
      this.nrhs = B.length
      this.rhs = this.convert2Dto1D(B)
    }
    else{
      this.rhs = B
      this.nrhs = 1
    }

    return this
  }
  solve(B){
    const m    = this.m 
    const n    = this.n
    const nnz  = this.nnz 
    const a    = this.a
    const asub = this.asub
    const xa   = this.xa 

    this.setRHS(B)
    const nrhs = this.nrhs
    const rhs  = this.rhs
    const superlu  = this.superlu
    const x = linSolve(superlu, m,n,nnz,a,asub, xa, nrhs,rhs)

    return x
  }
  convert2Dto1D(A){
    const a = A.reduce((pre,current) => {pre.push(...current);return pre},[]);
    return a
  }
  setCCSFromMatrix(A){ // Compressed Column Storage
    const m = A.length    
    const n = A[0].length    
    
    const a = []
    const asub = []
    const xa = [0]
    let count =0
    for(let j=0;j<n;j++){
      for(let i=0;i<m;i++){
        const aij = A[i][j]
        if(aij===0){continue}
        a.push(aij)
        asub.push(i)
        ++count
      }
      xa.push(count)
    }
    const nnz = a.length
    this.m = m
    this.n = n
    this.nnz = nnz
    this.a = a
    this.asub = asub
    this.xa = xa
    this.nnz = nnz

    return this
  }
}

const SLUW = class extends SLU{
  constructor(worker){
    super()
    this.worker = worker
  }
  terminate(){
    worker.terminate()
  }
  async solve(B){
    const m    = this.m
    const n    = this.n
    const nnz  = this.nnz
    const a    = this.a
    const asub = this.asub
    const xa   = this.xa

    super.setRHS(B)
    const nrhs = this.nrhs
    const rhs  = this.rhs

    const post = (message) =>new Promise(resolve => {
      this.worker.onmessage=(e)=>resolve(e.data)
      this.worker.onerror=(e)=>{
        console.log("ERROR OCCURED IN WORKER of SUPERLU")
        console.log(e.message)
        resolve(null)
      }
      this.worker.postMessage(message)
    })
   const message = {m,n,nnz,a,asub, xa, nrhs,rhs}
    const x = await post(message)
    return x
  }
}


export const linSolve = (superlu, m,n,nnz, a_, asub_, xa_, nrhs, rhs_) => {
  const F64Byte =  8 
  const I32Byte =  4 

  const a     = new Float64Array([...a_])
  const asub  = new Int32Array([...asub_])
  const xa    = new Int32Array([...xa_])
  const rhs   = new Float64Array([...rhs_])
  const X     = new Float64Array(m*nrhs)
  const Info  = new Int32Array(1)

  const aP    = superlu._malloc(nnz     * F64Byte)
  const asubP = superlu._malloc(nnz     * I32Byte)
  const xaP   = superlu._malloc((n+1)   * I32Byte)
  const rhsP  = superlu._malloc(m*nrhs  * F64Byte)
  const XP    = superlu._malloc(m*nrhs  * F64Byte)
  const InfoP = superlu._malloc(1       * I32Byte)


  superlu.HEAPF64.set(a     , aP/F64Byte)
  superlu.HEAP32.set(asub   , asubP/I32Byte)
  superlu.HEAP32.set(xa     , xaP/I32Byte)
  superlu.HEAPF64.set(rhs   , rhsP/F64Byte)
  superlu.HEAPF64.set(X     , XP/F64Byte)
  superlu.HEAP32.set(Info  , InfoP/I32Byte)

  superlu._solve(m, n,  nnz, aP, asubP, xaP, nrhs, rhsP,  XP, InfoP)


  const infoArray = new Int32Array(superlu.HEAP32.buffer, InfoP,1)
  const info = infoArray[0]
  const x = info >0 ? fillNaN(m,nrhs) :
           getFromHeap(superlu.HEAPF64.buffer, XP, m, nrhs, F64Byte)

  superlu._free(aP)
  superlu._free(asubP)
  superlu._free(xaP)
  superlu._free(rhsP)
  superlu._free(XP)
  superlu._free(InfoP)

  return x 
}

const fillNaN = (m, n) => {
  if(n==1){
    const x = [...Array(m)].fill(NaN)
    return x
  }
  else{
    const x = [...Array(m)].map(v=>[...Array(n)].fill(NaN))
    return x
  }
}

const getFromHeap = (buffer, P, m, nrhs, Byte) => {
  if(nrhs ==1) {
    const x_ = new Float64Array(buffer, P, m)
    const x = [...x_]
    return x
  }
  else{
    const x = []
    for(let i=0;i<nrhs;i++){
      const x_ = new Float64Array(buffer, P+i*m*Byte, m)
      x.push([...x_])
    }
    return x
  }
}



