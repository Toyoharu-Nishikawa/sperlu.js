EXFUNC = \
	'_dgssv', '_dgssvx'
	

all: install

install:

	$(CC) $(CFLAGS) main.c $(INC) $(BLAS) $(SLU) $(PRE) $(EFLAG) $(AFLAG) $(EXP) $(EMO)

CC = emcc
CFLAGS = -O3
#CFLAGS = -g
INC   = -I $(HOME)/cpp/superlu/wasm/include/
BLAS  = -L $(HOME)/cpp/superlu/wasm/lib/ -lblas
SLU   = -L $(HOME)/cpp/superlu/wasm/lib/ -lsuperlu 
#PRE   = --extern-pre-js sluModule.js
EFLAG = -sERROR_ON_UNDEFINED_SYMBOLS=0 
AFLAG = -sASSERTIONS 
#EXP =   -s "EXPORTED_FUNCTIONS=['_main','_malloc','_free', $(EXFUNC)]" 
EXP   = -s "EXPORTED_FUNCTIONS=['_malloc','_free']" 
EMO   = -s WASM=1 -s MODULARIZE=1 -s ALLOW_MEMORY_GROWTH -s MAXIMUM_MEMORY=4GB -s EXPORT_ES6=1 -o superlu.js

