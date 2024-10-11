pragma circom 2.0.0;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/mux1.circom";
include "division.circom";

template ZKConstantProductAMM() {
    // Private inputs
    signal input privateInputAmount;
    signal input privateMinReceived;

    // Public inputs
    signal input publicBalanceX;
    signal input publicBalanceY;
    signal input isSwapXtoY; // 1 if swapping X to Y, 0 if swapping Y to X

    // Outputs
    signal output newBalanceX;
    signal output newBalanceY;
    signal output amountReceived;

    // Calculate constant product
    signal constantProduct <== publicBalanceX * publicBalanceY;

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

    // Calculate new input balance
    signal newInputBalance <== inputBalance + privateInputAmount;

    // Calculate new output balance (y = k / x)
    component division = ReciprocalDivision(252);
    division.dividend <== constantProduct;
    division.divisor <== newInputBalance;
    signal newOutputBalance <== division.quotient;

    // Assign new balances
    signal intermediate1 <== (1 - isSwapXtoY) * newOutputBalance;
    newBalanceX <== isSwapXtoY * newInputBalance + intermediate1;
    signal intermediate2 <== (1 - isSwapXtoY) * newInputBalance;
    newBalanceY <== isSwapXtoY * newOutputBalance + intermediate2;

    // Calculate amount received
    signal intermediate3 <== isSwapXtoY * (publicBalanceY - newOutputBalance);
    signal intermediate4 <== (1 - isSwapXtoY) * (publicBalanceX - newOutputBalance);
    amountReceived <== intermediate3 + intermediate4;

    // Verify minimum received amount
    component checkMinReceived = GreaterEqThan(252);
    checkMinReceived.in[0] <== amountReceived;
    checkMinReceived.in[1] <== privateMinReceived;
    checkMinReceived.out === 1;

    // Range check for private inputs
    component privateInputAmountCheck = Num2Bits(252);
    privateInputAmountCheck.in <== privateInputAmount;

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

    // Verify constant product
    // newBalanceX * newBalanceY === constantProduct;
}

component main = ZKConstantProductAMM();