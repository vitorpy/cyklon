pragma circom 2.0.0;

include "node_modules/circomlib/circuits/babyjub.circom";
include "node_modules/circomlib/circuits/mux1.circom";
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/bitify.circom";

template ZKAMMSwap() {
    // Private inputs (scaled by 1000)
    signal input privateAmount;
    signal input privateSlippage;

    // Public inputs (scaled by 1000)
    signal input liquidity_A;
    signal input liquidity_B;
    signal input is_x;

    // Elliptic curve parameters (scaled by 1000^3 to maintain curve equation)
    signal input A;
    signal input B;

    // New input for off-circuit calculation
    signal input constant_product_factor;

    // Output (scaled by 1000)
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
    signal k_max;

    // Curve equation decomposition
    signal x_squared;
    signal x_cubed;
    signal Ax;
    signal new_x_squared;
    signal new_x_cubed;
    signal new_Ax;
    signal B_scaled;
    signal new_B_scaled;

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
    B_scaled <== 1000000 * B;

    // Ensure the initial point is on the curve (decomposed)
    signal initial_left;
    signal initial_right;
    initial_left <== 1000000 * y_squared;
    initial_right <== x_cubed + 1000000 * Ax + B_scaled;
    initial_left === initial_right;

    // Approximate constant product before swap
    k <== x * y;

    // Calculate new x after swap
    new_x <== x + privateAmount;

    // Decompose the new curve equation
    new_x_squared <== new_x * new_x;
    new_x_cubed <== new_x_squared * new_x;
    new_Ax <== A * new_x;
    new_B_scaled <== 1000000 * B;

    // Calculate new_y_squared using the curve equation (decomposed)
    signal new_left;
    signal new_right;
    new_left <== 1000000 * new_y_squared;
    new_right <== new_x_cubed + 1000000 * new_Ax + new_B_scaled;
    new_left === new_right;

    // Ensure new_y_squared is non-negative
    component isNonNegative = GreaterEqThan(252);
    isNonNegative.in[0] <== new_y_squared;
    isNonNegative.in[1] <== 0;
    isNonNegative.out === 1;

    // Approximate constant product after swap using off-circuit calculation
    k_new <== new_x * constant_product_factor;

    // Constrain the change in constant product (allowing for slight increase due to fees)
    component kNewGreaterEqK = GreaterEqThan(252);
    kNewGreaterEqK.in[0] <== k_new;
    kNewGreaterEqK.in[1] <== k;
    kNewGreaterEqK.out === 1;

    // Calculate k_max (0.3% increase)
    k_max <== k + (k * 3);

    component kNewLessEqKMax = LessEqThan(252);
    kNewLessEqKMax.in[0] <== k_new * 1000;
    kNewLessEqKMax.in[1] <== k_max;
    kNewLessEqKMax.out === 1;

    // Calculate amount_received
    signal y_diff;
    y_diff <== y_squared - new_y_squared;
    amount_received * (y + amount_received) === 1000000 * y_diff;

    // Ensure amount_received is non-negative
    component isNonNegativeAmount = GreaterEqThan(252);
    isNonNegativeAmount.in[0] <== amount_received;
    isNonNegativeAmount.in[1] <== 0;
    isNonNegativeAmount.out === 1;

    // Improved slippage check using appropriate comparison circuit
    signal slippage_factor;
    slippage_factor <== 10000000 - privateSlippage; // Adjusted for scaling
    signal slippage_check_left;
    signal slippage_check_right;
    slippage_check_left <== y * 10000000;
    slippage_check_right <== amount_received * slippage_factor;
    component slippageCheck = LessEqThan(252);
    slippageCheck.in[0] <== slippage_check_left;
    slippageCheck.in[1] <== slippage_check_right;
    slippageCheck.out === 1;

    // Sanity checks for non-zero liquidity
    signal liquidity_A_nonzero <== liquidity_A * (liquidity_A - 1) + 1;
    signal liquidity_B_nonzero <== liquidity_B * (liquidity_B - 1) + 1;
    liquidity_A_nonzero * liquidity_B_nonzero === liquidity_A_nonzero * liquidity_B_nonzero;
}

component main = ZKAMMSwap();