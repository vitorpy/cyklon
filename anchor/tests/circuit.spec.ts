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

    const output = await circuit.getDecoratedOutput(witness);
    
    expect(output[0]).toBe(1100n); // newBalanceX
    expect(output[1]).toBe(900n);  // newBalanceY
    expect(output[2]).toBe(100n);  // amountReceived
  });
});