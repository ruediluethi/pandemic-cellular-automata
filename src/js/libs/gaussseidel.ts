import * as tf from '@tensorflow/tfjs';
import { Tensor } from "@tensorflow/tfjs";

function printMatrix(v: number[][]){
    for (let i = 0; i < v.length; i++){
        let row = '';
        for (let j = 0; j < v[i].length; j++){
            // row = row + v[i][j].toLocaleString('en-US', { 
            //     maximumSignificantDigits: 7
            // }) + '  ';
            row = row + v[i][j].toPrecision(7) + '  ';
        }
        console.log(row);
    }
    console.log('');
}

function transposeMatrix(v: number[][]): number[][]{
    const w = [];
    for (let i = 0; i < v.length; i++){
        for (let j = 0; j < v[i].length; j++){
            if (w[j] === undefined) w[j] = []; // create row if not exists
            w[j][i] = v[i][j];
        }
    }
    return w;
}

function multiplyMatrix(A: number[][], B: number[][]){
    const C: number[][] = [];
    for (let i = 0; i < A.length; i++){
        C[i] = [];
        for (let j = 0; j < A[i].length; j++){
            C[i][j] = 0;
            for (let k = 0; k < A[i].length; k++){
                C[i][j] = C[i][j] + A[i][k]*B[k][j];
            }
        }
    }
    return C;
}

function gaussSeidel(A: number[][], b: number[][], maxIterations?: number, x0?: number[][]) {
    const n = A.length; // A must be symetric

    if (x0 === undefined){
        x0 = [];
        for (let i = 0; i < n; i++){
            x0[i] = [0];
        }
    }

    if (maxIterations === undefined) maxIterations = 1000;

    let x = x0;

    for (let k = 0; k < maxIterations; k++){
        const x_next: number[][] = [];
        for (let i = 0; i < n; i++){ // row-wise 
            let x_i = 0;

            // lower left side
            for (let j = 0; j < i; j++){
                x_i -= A[i][j]*x_next[j][0];
            }

            // upper right side
            for (let j = i+1; j < n; j++){
                x_i -= A[i][j]*x[j][0];
            }

            x_i += b[i][0];
            x_i /= A[i][i];

            x_next[i] = [x_i];
        }

        x = x_next;
    }

    return x;
}


const n = 300;

let AArray: number[][] = [];
for (let i = 0; i < n; i++){
    AArray[i] = [];
    for (let j = 0; j < n; j++){
        AArray[i][j] = Math.random();
    }
}
AArray = multiplyMatrix(AArray, transposeMatrix(AArray));
for (let i = 0; i < n; i++){
    AArray[i][i] += n;
}

//printMatrix(AArray);

let bArray: number[][] = [[]];
for (let i = 0; i < n; i++){
    bArray[0][i] = i+1;
}
bArray = transposeMatrix(bArray);
//printMatrix(bArray);


//printMatrix(xArray);

//printMatrix(transposeMatrix(AArray));
//console.log(AArray);

const A = tf.tensor(AArray);
//A.print();

const b = tf.tensor(bArray);
//b.print();

const ticQR = Date.now();
const x = solve(A, b);
const durationQR = Date.now() - ticQR;
const errQR:any = A.matMul(x).sub(b).norm().arraySync();
console.log('QR decomposition with err='+errQR+' in '+durationQR+'ms');
//x.print();

for (let it = 100; it <= n*10; it = it+100){  
    const ticGaussSeidel = Date.now();
    const x0: any = x.arraySync();
    let xArray = gaussSeidel(AArray, bArray, it);
    const durationGaussSeidel = Date.now() - ticGaussSeidel;

    const x_ = tf.tensor(xArray);
    const err:any = A.matMul(x_).sub(b).norm().arraySync();
    //const err = x.sub(x_).norm().arraySync();

    console.log(it+' iterations with err='+err+' in '+durationGaussSeidel+'ms diff='+(err-errQR));
}

function solve(A: Tensor, b: Tensor): Tensor {
    const [Q, R] = tf.linalg.qr(A);
    return back_substitution(R,Q.transpose().matMul(b));
}


function back_substitution(R: Tensor,b: Tensor): Tensor {
    
    const n = b.shape[0];
    const bArray: any = b.arraySync();
    const RArray: any = R.arraySync();
    
    const xArray: number[] = [];
    for (let i = n-1; i >= 0; i--){
        let x_i = bArray[i][0];
        for (let j = i+1; j < n; j++){
            x_i = x_i - RArray[i][j]*xArray[j];
        }
        x_i = x_i / RArray[i][i];
        xArray[i] = x_i;
    }
    return tf.tensor(xArray, [n,1]);
}