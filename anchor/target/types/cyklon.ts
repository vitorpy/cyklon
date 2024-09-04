/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/cyklon.json`.
 */
export type Cyklon = {
  "address": "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
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
          "name": "tokenMint0",
          "writable": true
        },
        {
          "name": "tokenMint1",
          "writable": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "userPosition",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "pool"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
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
        },
        {
          "name": "tickLower",
          "type": "i32"
        },
        {
          "name": "tickUpper",
          "type": "i32"
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
          "name": "tokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
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
          "name": "amountInMax",
          "type": "u64"
        },
        {
          "name": "minimumAmountOut",
          "type": "u64"
        },
        {
          "name": "proof",
          "type": "bytes"
        },
        {
          "name": "publicInputs",
          "type": {
            "vec": "u128"
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
          "signer": true
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
      "args": [
        {
          "name": "tickSpacing",
          "type": "u16"
        },
        {
          "name": "initialSqrtPrice",
          "type": "u128"
        }
      ]
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
    },
    {
      "name": "position",
      "discriminator": [
        170,
        188,
        143,
        228,
        122,
        64,
        247,
        208
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
      "name": "invalidTickRange",
      "msg": "Lower tick must be less than upper tick"
    },
    {
      "code": 6001,
      "name": "invalidLowerTick",
      "msg": "Lower tick must be a multiple of tick spacing"
    },
    {
      "code": 6002,
      "name": "invalidUpperTick",
      "msg": "Upper tick must be a multiple of tick spacing"
    },
    {
      "code": 6003,
      "name": "invalidProof",
      "msg": "Invalid zero-knowledge proof"
    },
    {
      "code": 6004,
      "name": "slippageExceeded",
      "msg": "Slippage tolerance exceeded"
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
            "name": "tickLower",
            "type": "i32"
          },
          {
            "name": "tickUpper",
            "type": "i32"
          },
          {
            "name": "liquidity",
            "type": "u128"
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
            "name": "tickSpacing",
            "type": "u16"
          },
          {
            "name": "sqrtPrice",
            "type": "u128"
          },
          {
            "name": "liquidity",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "position",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "tickLower",
            "type": "i32"
          },
          {
            "name": "tickUpper",
            "type": "i32"
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
