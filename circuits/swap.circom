pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

template CLMMSwap() {
    // Public inputs
    signal input publicSqrtPrice;
    signal input publicLiquidity;
    signal input publicAmountInMax;
    signal input publicMinimumAmountOut;
    
    // Private inputs
    signal input privateAmountIn;
    signal input privateZeroForOne;
    
    // Outputs
    signal output amountOut;
    signal output newSqrtPrice;
    
    // Intermediate signals
    signal sqrtPriceDelta;
    signal amountInActual;
    signal intermediateValue;
    signal intermediateMul;
    
    // Ensure privateAmountIn <= publicAmountInMax
    component lte = LessEqThan(64);
    lte.in[0] <== privateAmountIn;
    lte.in[1] <== publicAmountInMax;
    lte.out === 1;
    
    // Calculate swap
    intermediateValue <== privateAmountIn * 1000000;
    sqrtPriceDelta <== intermediateValue / publicLiquidity;
    
    // Conditional calculation based on swap direction
    component isZeroForOne = IsEqual();
    isZeroForOne.in[0] <== privateZeroForOne;
    isZeroForOne.in[1] <== 1;
    
    newSqrtPrice <== isZeroForOne.out * (publicSqrtPrice - sqrtPriceDelta) + 
                   (1 - isZeroForOne.out) * (publicSqrtPrice + sqrtPriceDelta);
    
    // Calculate amountOut (simplified)
    amountOut <== isZeroForOne.out * (privateAmountIn * publicLiquidity / publicSqrtPrice) +
                (1 - isZeroForOne.out) * (privateAmountIn * publicSqrtPrice / publicLiquidity);
    
    // Ensure amountOut >= publicMinimumAmountOut
    component gte = GreaterEqThan(64);
    gte.in[0] <== amountOut;
    gte.in[1] <== publicMinimumAmountOut;
    gte.out === 1;
}

component main = CLMMSwap();
