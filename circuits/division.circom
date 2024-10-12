pragma circom 2.0.0;

include "node_modules/circomlib/circuits/bitify.circom";
include "node_modules/circomlib/circuits/comparators.circom";

template ReciprocalDivision(n) {
    signal input dividend;
    signal input divisor;
    signal output quotient;
    
    // Ensure divisor is not zero
    component isZero = IsZero();
    isZero.in <== divisor;
    isZero.out === 0;
    
    // Perform division
    signal remainder;
    quotient <-- dividend \ divisor;
    remainder <-- dividend % divisor;
    
    // Constrain the result
    dividend === quotient * divisor + remainder;
    
    // Ensure remainder is less than divisor
    component lessThan = LessThan(n);
    lessThan.in[0] <== remainder;
    lessThan.in[1] <== divisor;
    lessThan.out === 1;
}
