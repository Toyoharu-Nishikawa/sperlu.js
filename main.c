//#include<stdio.h>
#include <emscripten.h>
#include "slu_ddefs.h" 

/**** PROTOTYPE ***/
extern void EMSCRIPTEN_KEEPALIVE solve(int m, int n,  int  nnz, double *a_,int *asub_, int *xa_,int nrhs_, double *rhs_,   double *X, int *info);
void copyMatrix(SuperMatrix *A, double*X);

/*****************/

//int main(){
//  printf("superlu wasm\n");
//  return 0;	
//}


//void solve(int m, int n,  int  nnz, double *a_,int *asub_, int *xa_, int nrhs, double *rhs_,   double *X){
void solve(int m, int n,  int  nnz, double *a,int *asub, int *xa, int nrhs, double *rhs,   double *X, int *info){

  SuperMatrix A, L, U, B;

  int i;

  int      *perm_r; /* row permutations from partial pivoting */
  int      *perm_c; /* column permutation vector */
  int       permc_spec;
  superlu_options_t options;
  SuperLUStat_t stat;


  dCreate_CompCol_Matrix(&A, m, n, nnz, a, asub, xa, SLU_NC, SLU_D, SLU_GE);
  dCreate_Dense_Matrix(&B, m, nrhs, rhs, m, SLU_DN, SLU_D, SLU_GE);
//  dPrint_Dense_Matrix("B", &B);

  if ( !(perm_r = intMalloc(m)) ) ABORT("Malloc fails for perm_r[].");
  if ( !(perm_c = intMalloc(n)) ) ABORT("Malloc fails for perm_c[].");

  /* Set the default input options. */
  set_default_options(&options);
  options.ColPerm = NATURAL;

  /* Initialize the statistics variables. */
  StatInit(&stat);

  /* Solve the linear system. */
  dgssv(&options, &A, perm_c, perm_r, &L, &U, &B, &stat, info);
  copyMatrix(&B, X);

//  dPrint_CompCol_Matrix("A", &A);
//  dPrint_CompCol_Matrix("U", &U);
//  dPrint_SuperNode_Matrix("L", &L);
//  dPrint_Dense_Matrix("B", &B);
 

  /* De-allocate storage */
//  SUPERLU_FREE (rhs);
  SUPERLU_FREE (perm_r);
  SUPERLU_FREE (perm_c);
  Destroy_CompCol_Matrix(&A);
  Destroy_SuperMatrix_Store(&B);
  Destroy_SuperNode_Matrix(&L);
  Destroy_CompCol_Matrix(&U);
  StatFree(&stat);
}

void copyMatrix(SuperMatrix *A, double*X){
  DNformat     *Astore = (DNformat *) A->Store;
  register int i, j, lda = Astore->lda;
  double       *dp;

  dp = (double *) Astore->nzval;
  for(j = 0; j < A->ncol; ++j) {
    for (i = 0; i < A->nrow; ++i){
      X[i + j*lda] = dp[i + j*lda];
    }
  }
}
 
