import {SUPERLU, linSolve} from "./index.js"

let superlu = null
self.onmessage = async (e) => {
  if(!superlu){
    superlu = await SUPERLU()
  }
  const data = e.data
  const {m,n,nnz,a,asub, xa, nrhs,rhs} = data
  const x = linSolve(superlu, m,n,nnz,a,asub, xa, nrhs,rhs)
  postMessage(x)
}

