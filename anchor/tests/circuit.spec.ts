import { wasm as wasm_tester } from "circom_tester";
import * as path from "path";

describe("ZK Constant Sum AMM Swap", () => {
  let circuit: any;

  beforeAll(async () => {
    circuit = await wasm_tester(path.join(__dirname, "../../circuits", "swap.circom"), {
      include: [path.join(__dirname, "../../")]
    });
  });

  it("should perform a valid swap from X to Y", async () => {
    const input = {
      privateAmount: 100,
      privateMinReceived: 90,
      publicBalanceX: 1000,
      publicBalanceY: 1000,
      isSwapXtoY: 1,
      totalLiquidity: 2000
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);
    
    await circuit.loadSymbols();

    const newBalanceX = circuit.symbols["main.newBalanceX"];
    const newBalanceY = circuit.symbols["main.newBalanceY"];
    const amountReceived = circuit.symbols["main.amountReceived"];

    expect(witness[newBalanceX.varIdx]).toBe(1100n); // newBalanceX
    expect(witness[newBalanceY.varIdx]).toBe(900n);  // newBalanceY
    expect(witness[amountReceived.varIdx]).toBe(100n);  // amountReceived
  });

  it("should perform a valid swap with larger values matching groth16 test", async () => {
    const input = {
      privateAmount: 100000,
      privateMinReceived: 99000,
      publicBalanceX: 1000000,
      publicBalanceY: 2000000,
      isSwapXtoY: 1,
      totalLiquidity: 3000000
    };

    const witness = await circuit.calculateWitness(input);
    await circuit.checkConstraints(witness);
    
    await circuit.loadSymbols();

    const newBalanceX = circuit.symbols["main.newBalanceX"];
    const newBalanceY = circuit.symbols["main.newBalanceY"];
    const amountReceived = circuit.symbols["main.amountReceived"];

    expect(witness[newBalanceX.varIdx]).toBe(1100000n); // newBalanceX
    expect(witness[newBalanceY.varIdx]).toBe(1900000n); // newBalanceY
    expect(witness[amountReceived.varIdx]).toBe(100000n); // amountReceived
  });
});