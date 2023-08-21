# superlu.js

## How to use superlu

```
// smple code
import {superLU} from "./node_modules/superlu/index.js"

export let SLU = null
const main = async () => {
  const s = 19
  const u = 21
  const p = 16
  const e =  5
  const r = 18
  const l = 12

  const A = [
    [s, 0, u, u, 0],
    [l, u, 0, 0, 0],
    [0, l, p, 0, 0],
    [0, 0, 0, e, u],
    [l, l, 0, 0, r],
  ]

  SLU = await superLU()
  console.log("SLU", SLU)

  const slu = SLU.fromMatrix(A)

  /** set system matrix from CCS(compressed colummnh strage) format
    const colIndex = [0, 1, 4, 1, 2, 4, 0, 2, 0, 3, 3, 4]
    const nnz = 12
    const rowPtr = [0, 3, 6, 8, 10, 12]
    const rows = 5
    const val = [19, 12, 12, 21, 12, 12, 21, 16, 21, 5, 21, 18]

    const amg = AMG.fromCCS(rows,rows,nnz,val,colIndex,rowPtr)
   */


  console.log("slu", slu)
  console.log("CCS",slu.CCS)



  const V = [1,1,1,1,1]

  const B = [
    [1,1,1,1,1],
    [1,2,1,2,1],
  ]


  const U = slu.solve(V) // solve for U:  AU = V^T (V is trnasposed) 

  const  ans = [-0.031250,  0.065476,  0.013393,  0.062500,  0.032738]
  console.log("ans", ans)
  console.log("U", U)

  const x = slu.solve(B) //  solve for x: Ax = B^T (B is trnasposed)
  console.log("x",x)


}
main()
```



## How to make wasm

1. install csh
```
sudo apt install csh
```


2. install emscripten
```
apt install cmake python3 
git clone https://github.com/emscripten-core/emsdk.git 
cd emsdk
./emsdk install latest 
./emsdk activate latest 
source ./emsdk_env.sh 
```

3. clone superlu from Git Hub 
```
mkdir ~/cpp
cd ~/cpp
git clone https://github.com/xiaoyeli/superlu.git 
mkdir wasm
cd wasm
emcmake cmake \
  -DCMAKE_INSTALL_PREFIX=../wasm \
  -DCMAKE_INSTALL_INCLUDEDIR=include \
  -Denable_internal_blaslib=YES \
  ..
make
make install
```


4. make wasm 
run below command in this folder 
```
make 
```


