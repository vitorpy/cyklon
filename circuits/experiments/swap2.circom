pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/mux1.circom";

template ZKAMMSwap() {
    // Private inputs
    signal input privateAmount;
    signal input privateSlippage;

    // Public inputs
    signal input liquidity_A;
    signal input liquidity_B;
    signal input is_x;

    // Output
    signal output amount_received;

    // Intermediate signals
    signal x;
    signal y;
    signal new_x;
    signal new_y;
    signal k;

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

    // Calculate constant product k
    k <== x * y;

    // Calculate new x after swap
    new_x <== x + privateAmount;

    // Custom constraint to enforce the AMM relationship
    // This is equivalent to: new_y = (x * y) / new_x
    // But we rearrange it to avoid division: new_y * new_x = x * y
    new_y * new_x === x * y;

    // Calculate amount received
    amount_received <== y - new_y;

    // Slippage check using GreaterEqThan component
    component slippageCheck = GreaterEqThan(252);
    slippageCheck.in[0] <== amount_received * 10000;
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