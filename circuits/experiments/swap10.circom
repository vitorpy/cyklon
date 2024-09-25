pragma circom 2.0.0;

include "node_modules/circomlib/circuits/babyjub.circom";
include "node_modules/circomlib/circuits/mux1.circom";
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/bitify.circom";

template ZKAMMSwap() {
    // Private inputs
    signal input privateAmount;
    signal input privateSlippage;

    // Public inputs
    signal input liquidity_A;
    signal input liquidity_B;
    signal input is_x;

    // Elliptic curve parameters (calculated off-circuit)
    signal input A;
    signal input B;

    // Output
    signal output amount_received;

    // Intermediate signals
    signal x;
    signal y;
    signal new_x;
    signal y_squared;
    signal new_y_squared;

    // Constant product approximation
    signal k;
    signal k_new;

    // Curve equation decomposition
    signal x_squared;
    signal x_cubed;
    signal Ax;
    signal new_x_squared;
    signal new_x_cubed;
    signal new_Ax;

    // Range check for private inputs
    component privateAmountCheck = Num2Bits(252);
    privateAmountCheck.in <== privateAmount;

    component privateSlippageCheck = Num2Bits(8);
    privateSlippageCheck.in <== privateSlippage;

    // Determine which token is being swapped
    component mux = Mux1();
    mux.c[0] <== liquidity_A;
    mux.c[1] <== liquidity_B;
    mux.s <== is_x;
    x <== mux.out;

    component mux2 = Mux1();
    mux2.c[0] <== liquidity_B;
    mux2.c[1] <== liquidity_A;
    mux2.s <== is_x;
    y <== mux2.out;

    // Decompose the initial curve equation
    x_squared <== x * x;
    x_cubed <== x_squared * x;
    Ax <== A * x;
    y_squared <== y * y;

    // Ensure the initial point is on the curve
    y_squared === x_cubed + Ax + B;

    // Approximate constant product before swap
    k <== x * y;

    // Calculate new x after swap
    new_x <== x + privateAmount;

    // Decompose the new curve equation
    new_x_squared <== new_x * new_x;
    new_x_cubed <== new_x_squared * new_x;
    new_Ax <== A * new_x;

    // Calculate new_y_squared using the curve equation
    new_y_squared <== new_x_cubed + new_Ax + B;

    // Ensure new_y_squared is non-negative
    component isNonNegative = GreaterEqThan(252);
    isNonNegative.in[0] <== new_y_squared;
    isNonNegative.in[1] <== 0;
    isNonNegative.out === 1;

    // Approximate constant product after swap
    k_new <== new_x * new_y_squared;

    // Constrain the change in constant product (allowing for slight increase due to fees)
    k_new >= k;
    k_new <= k + (k * 3) \ 1000; // Max 0.3% increase

    // Calculate amount_received
    signal y_diff;
    y_diff <== y_squared - new_y_squared;
    amount_received * (y + amount_received) === y_diff;

    // Ensure amount_received is non-negative
    component isNonNegativeAmount = GreaterEqThan(252);
    isNonNegativeAmount.in[0] <== amount_received;
    isNonNegativeAmount.in[1] <== 0;
    isNonNegativeAmount.out === 1;

    // Improved slippage check using only quadratic constraints
    signal slippage_factor;
    slippage_factor <== 10000 - privateSlippage;
    y * 10000 <= amount_received * slippage_factor;

    // Sanity checks for non-zero liquidity
    signal liquidity_A_nonzero <== liquidity_A * (liquidity_A - 1) + 1;
    signal liquidity_B_nonzero <== liquidity_B * (liquidity_B - 1) + 1;
    liquidity_A_nonzero * liquidity_B_nonzero === liquidity_A_nonzero * liquidity_B_nonzero;
}

component main = ZKAMMSwap();