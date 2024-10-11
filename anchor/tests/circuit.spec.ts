import { wasm as wasm_tester } from "circom_tester";
import * as path from "path";

// Add this function at the top of your test file, outside of any describe blocks
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
function isWithinTolerance(actual: bigint, expected: bigint, tolerancePercent: number = 5): boolean {
  const tolerance = (expected * BigInt(tolerancePercent)) / BigInt(100);
  const lowerBound = expected - tolerance;
  const upperBound = expected + tolerance;
  return actual >= lowerBound && actual <= upperBound;
}

describe("ZK Constant Sum AMM Swap", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let circuit: any;

  beforeAll(async () => {
    circuit = await wasm_tester(path.join(__dirname, "../../circuits", "swap.circom"), {
      include: [path.join(__dirname, "../../")]
    });
  });

  it("should perform a valid swap from X to Y", async () => {
    const input = {
      privateInputAmount: 100,
      privateMinReceived: 1,
      publicBalanceX: 1000,
      publicBalanceY: 1000,
      isSwapXtoY: 1
    };

    console.log("Initial state:", input);
    console.log("Initial constant product:", input.publicBalanceX * input.publicBalanceY);

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);
    
    await circuit.loadSymbols();

    const newBalanceX = circuit.symbols["main.newBalanceX"];
    const newBalanceY = circuit.symbols["main.newBalanceY"];
    const amountReceived = circuit.symbols["main.amountReceived"];

    console.log("Final state:");
    console.log("New Balance X:", witness[newBalanceX.varIdx].toString());
    console.log("New Balance Y:", witness[newBalanceY.varIdx].toString());
    console.log("Amount Received:", witness[amountReceived.varIdx].toString());
    console.log("Final constant product:", BigInt(witness[newBalanceX.varIdx]) * BigInt(witness[newBalanceY.varIdx]));

    expect(isWithinTolerance(BigInt(witness[newBalanceX.varIdx]), 1100n)).toBe(true);
    expect(isWithinTolerance(BigInt(witness[newBalanceY.varIdx]), 909n)).toBe(true);
    expect(isWithinTolerance(BigInt(witness[amountReceived.varIdx]), 91n)).toBe(true);
  });

  it("should perform a valid swap with larger values", async () => {
    const input = {
      privateInputAmount: 100000,
      privateMinReceived: 99000,
      publicBalanceX: 1100000,
      publicBalanceY: 1900000,
      isSwapXtoY: 1
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);
    
    await circuit.loadSymbols();

    const newBalanceX = circuit.symbols["main.newBalanceX"];
    const newBalanceY = circuit.symbols["main.newBalanceY"];
    const amountReceived = circuit.symbols["main.amountReceived"];

    console.log("Final state:");
    console.log("New Balance X:", witness[newBalanceX.varIdx].toString());
    console.log("New Balance Y:", witness[newBalanceY.varIdx].toString());
    console.log("Amount Received:", witness[amountReceived.varIdx].toString());
    console.log("Final constant product:", BigInt(witness[newBalanceX.varIdx]) * BigInt(witness[newBalanceY.varIdx]));

    expect(isWithinTolerance(BigInt(witness[newBalanceX.varIdx]), 1200000n)).toBe(true);
    expect(isWithinTolerance(BigInt(witness[newBalanceY.varIdx]), 1741667n)).toBe(true);
    expect(isWithinTolerance(BigInt(witness[amountReceived.varIdx]), 158333n)).toBe(true);
  });

  // Add a new test for swapping Y to X
  it("should perform a valid swap from Y to X", async () => {
    const input = {
      privateInputAmount: 100,
      privateMinReceived: 90,
      publicBalanceX: 1000,
      publicBalanceY: 1000,
      isSwapXtoY: 0
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);
    
    await circuit.loadSymbols();

    const newBalanceX = circuit.symbols["main.newBalanceX"];
    const newBalanceY = circuit.symbols["main.newBalanceY"];
    const amountReceived = circuit.symbols["main.amountReceived"];

    console.log("Final state:");
    console.log("New Balance X:", witness[newBalanceX.varIdx].toString());
    console.log("New Balance Y:", witness[newBalanceY.varIdx].toString());
    console.log("Amount Received:", witness[amountReceived.varIdx].toString());
    console.log("Final constant product:", BigInt(witness[newBalanceX.varIdx]) * BigInt(witness[newBalanceY.varIdx]));

    expect(isWithinTolerance(BigInt(witness[newBalanceX.varIdx]), 909n)).toBe(true);
    expect(isWithinTolerance(BigInt(witness[newBalanceY.varIdx]), 1100n)).toBe(true);
    expect(isWithinTolerance(BigInt(witness[amountReceived.varIdx]), 91n)).toBe(true);
  });
});

describe("ReciprocalDivision", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let divisionCircuit: any;

  beforeAll(async () => {
    divisionCircuit = await wasm_tester(path.join(__dirname, "../../circuits", "division_test.circom"), {
      include: [path.join(__dirname, "../../")]
    });
  });

  const testCases = [
    { dividend: 1000n, divisor: 10n, expected: 100n },
    { dividend: 1000n, divisor: 3n, expected: 333n },
    { dividend: 1000000n, divisor: 1000n, expected: 1000n },
    { dividend: 1234567n, divisor: 1000n, expected: 1234n },
    { dividend: 1000000000n, divisor: 3n, expected: 333333333n },
  ];

  testCases.forEach(({ dividend, divisor, expected }) => {
    it(`should correctly divide ${dividend} by ${divisor}`, async () => {
      const input = {
        dividend: dividend,
        divisor: divisor
      };

      const witness = await divisionCircuit.calculateWitness(input);
      await divisionCircuit.checkConstraints(witness);

      await divisionCircuit.loadSymbols();

      const quotientSymbol = divisionCircuit.symbols["main.quotient"];
      const quotient = witness[quotientSymbol.varIdx];

      console.log(`Dividend: ${dividend}, Divisor: ${divisor}, Quotient: ${quotient}, Expected: ${expected}`);

      // Allow for small rounding errors
      const tolerance = 1n;
      expect(quotient).toBeGreaterThanOrEqual(expected - tolerance);
      expect(quotient).toBeLessThanOrEqual(expected + tolerance);
    });
  });

  it("should handle edge cases", async () => {
    const edgeCases = [
      { dividend: 1n, divisor: 1n, expected: 1n },
      { dividend: 0n, divisor: 10n, expected: 0n },
      { dividend: 1000000000n, divisor: 1n, expected: 1000000000n },
    ];

    for (const { dividend, divisor, expected } of edgeCases) {
      const input = { dividend, divisor };
      const witness = await divisionCircuit.calculateWitness(input);
      await divisionCircuit.checkConstraints(witness);

      await divisionCircuit.loadSymbols();

      const quotientSymbol = divisionCircuit.symbols["main.quotient"];
      const quotient = witness[quotientSymbol.varIdx];

      console.log(`Edge case - Dividend: ${dividend}, Divisor: ${divisor}, Quotient: ${quotient}, Expected: ${expected}`);

      expect(quotient).toBe(expected);
    }
  });
});