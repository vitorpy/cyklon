pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/mux1.circom";

template ZKConstantSumAMM() {
    // Private inputs
    signal input privateAmount;
    signal input privateMinReceived;

    // Public inputs
    signal input publicBalanceX;
    signal input publicBalanceY;
    signal input isSwapXtoY; // 1 if swapping X to Y, 0 if swapping Y to X

    // Public constant (total liquidity)
    signal input totalLiquidity;

    // Outputs
    signal output newBalanceX;
    signal output newBalanceY;
    signal output amountReceived;

    // Verify total liquidity
    publicBalanceX + publicBalanceY === totalLiquidity;

    // Determine swap direction and calculate amounts
    component muxInput = Mux1();
    muxInput.c[0] <== publicBalanceY;
    muxInput.c[1] <== publicBalanceX;
    muxInput.s <== isSwapXtoY;
    signal inputBalance <== muxInput.out;

    component muxOutput = Mux1();
    muxOutput.c[0] <== publicBalanceX;
    muxOutput.c[1] <== publicBalanceY;
    muxOutput.s <== isSwapXtoY;
    signal outputBalance <== muxOutput.out;

    // Calculate new balances
    signal newInputBalance <== inputBalance + privateAmount;
    amountReceived <== outputBalance - (totalLiquidity - newInputBalance);

    // Assign new balances
    component muxNewX = Mux1();
    muxNewX.c[0] <== publicBalanceX;
    muxNewX.c[1] <== newInputBalance;
    muxNewX.s <== isSwapXtoY;
    newBalanceX <== muxNewX.out;

    component muxNewY = Mux1();
    muxNewY.c[0] <== totalLiquidity - newInputBalance;
    muxNewY.c[1] <== totalLiquidity - newBalanceX;
    muxNewY.s <== isSwapXtoY;
    newBalanceY <== muxNewY.out;

    // Verify minimum received amount
    component checkMinReceived = GreaterEqThan(252);
    checkMinReceived.in[0] <== amountReceived;
    checkMinReceived.in[1] <== privateMinReceived;
    checkMinReceived.out === 1;

    // Range check for private inputs
    component privateAmountCheck = Num2Bits(252);
    privateAmountCheck.in <== privateAmount;

    component privateMinReceivedCheck = Num2Bits(252);
    privateMinReceivedCheck.in <== privateMinReceived;

    // Sanity checks
    component positiveBalance1 = GreaterEqThan(252);
    positiveBalance1.in[0] <== newBalanceX;
    positiveBalance1.in[1] <== 0;
    positiveBalance1.out === 1;

    component positiveBalance2 = GreaterEqThan(252);
    positiveBalance2.in[0] <== newBalanceY;
    positiveBalance2.in[1] <== 0;
    positiveBalance2.out === 1;
}

component main = ZKConstantSumAMM();