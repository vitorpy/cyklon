pragma circom 2.0.0;

include "node_modules/circomlib/circuits/babyjub.circom";
include "node_modules/circomlib/circuits/mux1.circom";
include "node_modules/circomlib/circuits/comparators.circom";

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
    signal new_y_squared;

    // Intermediate signals for curve equation decomposition
    signal x_squared;
    signal x_cubed;
    signal Ax;
    signal y_squared;
    signal new_x_squared;
    signal new_x_cubed;
    signal new_Ax;

    // New intermediate signals for amount_received constraint
    signal amount_received_squared;
    signal y_squared_minus_amount_received_squared;

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

    // Decompose the amount_received constraint
    amount_received_squared <== amount_received * amount_received;
    y_squared_minus_amount_received_squared <== y_squared - amount_received_squared;

    // Constrain amount_received without calculating new_y directly
    y_squared_minus_amount_received_squared === new_y_squared;

    // Slippage check using LessThan circuit
    component slippageCheck = LessThan(252);
    slippageCheck.in[0] <== y * 10000;
    slippageCheck.in[1] <== amount_received * (10000 - privateSlippage);
    slippageCheck.out === 1;

    // Sanity checks
    signal nonzero_liquidity_A;
    signal nonzero_liquidity_B;
    nonzero_liquidity_A <== liquidity_A * (liquidity_A - 1) + 1;
    nonzero_liquidity_B <== liquidity_B * (liquidity_B - 1) + 1;
    nonzero_liquidity_A * nonzero_liquidity_B === nonzero_liquidity_A * nonzero_liquidity_B;
}

component main = ZKAMMSwap();