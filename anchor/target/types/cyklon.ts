/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/cyklon.json`.
 */
export type Cyklon = {
  "address": "5WrVRh6pUTvyrjrTn4GKGebsZn2GnqBK2h7agfn2QvBX",
  "metadata": {
    "name": "cyklon",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "cyklon"
  },
  "instructions": [
    {
      "name": "addLiquidity",
      "discriminator": [
        181,
        157,
        89,
        67,
        143,
        182,
        52,
        72
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "userTokenAccount0",
          "writable": true
        },
        {
          "name": "userTokenAccount1",
          "writable": true
        },
        {
          "name": "poolTokenAccount0",
          "writable": true
        },
        {
          "name": "poolTokenAccount1",
          "writable": true
        },
        {
          "name": "tokenMint0"
        },
        {
          "name": "tokenMint1"
        },
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount0",
          "type": "u64"
        },
        {
          "name": "amount1",
          "type": "u64"
        }
      ]
    },
    {
      "name": "confidentialSwap",
      "discriminator": [
        94,
        224,
        95,
        178,
        166,
        124,
        121,
        91
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "pool.token_mint_0",
                "account": "pool"
              },
              {
                "kind": "account",
                "path": "pool.token_mint_1",
                "account": "pool"
              }
            ]
          }
        },
        {
          "name": "userTokenAccountIn",
          "writable": true
        },
        {
          "name": "userTokenAccountOut",
          "writable": true
        },
        {
          "name": "poolTokenAccount0",
          "writable": true
        },
        {
          "name": "poolTokenAccount1",
          "writable": true
        },
        {
          "name": "tokenMint0",
          "writable": true
        },
        {
          "name": "tokenMint1",
          "writable": true
        },
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "proofA",
          "type": {
            "array": [
              "u8",
              64
            ]
          }
        },
        {
          "name": "proofB",
          "type": {
            "array": [
              "u8",
              128
            ]
          }
        },
        {
          "name": "proofC",
          "type": {
            "array": [
              "u8",
              64
            ]
          }
        },
        {
          "name": "publicInputs",
          "type": {
            "array": [
              {
                "array": [
                  "u8",
                  32
                ]
              },
              2
            ]
          }
        }
      ]
    },
    {
      "name": "initializePool",
      "discriminator": [
        95,
        180,
        10,
        172,
        84,
        174,
        232,
        40
      ],
      "accounts": [
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "tokenMint0"
              },
              {
                "kind": "account",
                "path": "tokenMint1"
              }
            ]
          }
        },
        {
          "name": "tokenMint0"
        },
        {
          "name": "tokenMint1"
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    }
  ],
  "events": [
    {
      "name": "confidentialSwapEvent",
      "discriminator": [
        71,
        57,
        223,
        200,
        23,
        15,
        103,
        112
      ]
    },
    {
      "name": "liquidityAdded",
      "discriminator": [
        154,
        26,
        221,
        108,
        238,
        64,
        217,
        161
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidInput",
      "msg": "Invalid input"
    },
    {
      "code": 6001,
      "name": "invalidProof",
      "msg": "Invalid proof"
    },
    {
      "code": 6002,
      "name": "invalidTickRange",
      "msg": "Lower tick must be less than upper tick"
    },
    {
      "code": 6003,
      "name": "invalidLowerTick",
      "msg": "Lower tick must be a multiple of tick spacing"
    },
    {
      "code": 6004,
      "name": "invalidUpperTick",
      "msg": "Upper tick must be a multiple of tick spacing"
    },
    {
      "code": 6005,
      "name": "slippageExceeded",
      "msg": "Slippage tolerance exceeded"
    },
    {
      "code": 6006,
      "name": "mathOverflow",
      "msg": "Math overflow"
    }
  ],
  "types": [
    {
      "name": "confidentialSwapEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amountOut",
            "type": "u64"
          },
          {
            "name": "newSqrtPrice",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "liquidityAdded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "amount0",
            "type": "u64"
          },
          {
            "name": "amount1",
            "type": "u64"
          },
          {
            "name": "liquidity",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tokenMint0",
            "type": "pubkey"
          },
          {
            "name": "tokenMint1",
            "type": "pubkey"
          },
          {
            "name": "reserve0",
            "type": "u64"
          },
          {
            "name": "reserve1",
            "type": "u64"
          },
          {
            "name": "liquidity",
            "type": "u128"
          }
        ]
      }
    }
  ]
};
