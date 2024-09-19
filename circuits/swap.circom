pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";

template CPMMSwap() {
    // Public inputs
    signal input publicReserve0;
    signal input publicReserve1;
    signal input publicAmountInMax;
    signal input publicMinimumAmountOut;
    
    // Private inputs
    signal input privateAmountIn;
    signal input privateSlippage; // Represented as a percentage (e.g., 1% = 100)
    signal input privateZeroForOne;
    
    // Outputs
    signal output newReserve0;
    signal output newReserve1;
    signal output amountIn;
    signal output amountOut;
    
    // Ensure privateAmountIn <= publicAmountInMax
    component lte = LessEqThan(64);
    lte.in[0] <== privateAmountIn;
    lte.in[1] <== publicAmountInMax;
    lte.out === 1;
    
    // Calculate swap
    signal k;
    k <== publicReserve0 * publicReserve1;
    
    signal reserveIn;
    signal reserveOut;
    reserveIn <== privateZeroForOne * publicReserve0 + (1 - privateZeroForOne) * publicReserve1;
    reserveOut <== privateZeroForOne * publicReserve1 + (1 - privateZeroForOne) * publicReserve0;
    
    signal newReserveIn;
    newReserveIn <== reserveIn + privateAmountIn;
    
    signal newReserveOut;
    newReserveOut <== k / newReserveIn;
    
    signal rawAmountOut;
    rawAmountOut <== reserveOut - newReserveOut;
    
    // Apply slippage
    signal slippageFactor;
    slippageFactor <== 10000 - privateSlippage;
    
    amountOut <== (rawAmountOut * slippageFactor) / 10000;
    
    // Ensure amountOut >= publicMinimumAmountOut
    component gte = GreaterEqThan(64);
    gte.in[0] <== amountOut;
    gte.in[1] <== publicMinimumAmountOut;
    gte.out === 1;
    
    // Set outputs
    newReserve0 <== privateZeroForOne * newReserveIn + (1 - privateZeroForOne) * newReserveOut;
    newReserve1 <== privateZeroForOne * newReserveOut + (1 - privateZeroForOne) * newReserveIn;
    amountIn <== privateAmountIn;
}

component main = CPMMSwap();
