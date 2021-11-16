module.exports = {

    create: function(n, m, defaultValue){
        if (defaultValue === undefined) defaultValue = 0;
        var A = [];
        for (let i = 0; i < n; i++){
            A[i] = [];
            for (let j = 0; j < m; j++){
                A[i][j] = defaultValue;
            }
        }
        return A;
    },

    print: function(v){
        var output = '';
        for (let i = 0; i < v.length; i++){
            let row = '';
            for (let j = 0; j < v[i].length; j++){
                // row = row + v[i][j].toLocaleString('en-US', { 
                //     maximumSignificantDigits: 7
                // }) + '  ';
                row = row + v[i][j].toPrecision(3) + '  ';
            }
            output += row + '\n';
        }
        console.log(output);
    },
    
    transpose: function(v){
        const w = [];
        for (let i = 0; i < v.length; i++){
            for (let j = 0; j < v[i].length; j++){
                if (w[j] === undefined) w[j] = []; // create row if not exists
                w[j][i] = v[i][j];
            }
        }
        return w;
    },
    
    multiply: function(A, B){
        const C = [];
        for (let i = 0; i < A.length; i++){
            C[i] = [];
            for (let j = 0; j < B[i].length; j++){
                C[i][j] = 0;
                for (let k = 0; k < A[i].length; k++){
                    C[i][j] = C[i][j] + A[i][k]*B[k][j];
                }
            }
        }
        return C;
    },

    scale: function(A, factor){
        const C = [];
        for (let i = 0; i < A.length; i++){
            C[i] = [];
            for (let j = 0; j < A[i].length; j++){
                C[i][j] = factor * A[i][j];
            }
        }
        return C;
    },

    gaussSeidel: function(A, b, maxIterations, x0) {
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
            const x_next = [];
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

}