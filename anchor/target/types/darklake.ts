/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/darklake.json`.
 */
export type Darklake = {
  address: 'GKkoBt4y1oXfUDkRjZG2wj6PQxw39dxZw6MNMM6tYaBy';
  metadata: {
    name: 'darklake';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'darklake';
  };
  instructions: [
    {
      name: 'addLiquidity';
      discriminator: [181, 157, 89, 67, 143, 182, 52, 72];
      accounts: [
        {
          name: 'tokenMintX';
        },
        {
          name: 'tokenMintY';
        },
        {
          name: 'tokenMintXProgram';
        },
        {
          name: 'tokenMintYProgram';
        },
        {
          name: 'tokenMintLp';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [108, 112];
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
          };
        },
        {
          name: 'tokenMintLpProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108];
              },
              {
                kind: 'account';
                path: 'pool.token_mint_x';
                account: 'pool';
              },
              {
                kind: 'account';
                path: 'pool.token_mint_y';
                account: 'pool';
              }
            ];
          };
        },
        {
          name: 'userTokenAccountX';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'account';
                path: 'tokenMintXProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'userTokenAccountY';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'account';
                path: 'tokenMintYProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'userTokenAccountLp';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'account';
                path: 'tokenMintLpProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintLp';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'poolTokenAccountX';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'account';
                path: 'tokenMintXProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'poolTokenAccountY';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'account';
                path: 'tokenMintYProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [
        {
          name: 'amount0';
          type: 'u64';
        },
        {
          name: 'amount1';
          type: 'u64';
        }
      ];
    },
    {
      name: 'confidentialSwap';
      discriminator: [94, 224, 95, 178, 166, 124, 121, 91];
      accounts: [
        {
          name: 'tokenMintX';
          writable: true;
        },
        {
          name: 'tokenMintY';
          writable: true;
        },
        {
          name: 'tokenMintXProgram';
        },
        {
          name: 'tokenMintYProgram';
        },
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108];
              },
              {
                kind: 'account';
                path: 'pool.token_mint_x';
                account: 'pool';
              },
              {
                kind: 'account';
                path: 'pool.token_mint_y';
                account: 'pool';
              }
            ];
          };
        },
        {
          name: 'userTokenAccountX';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'account';
                path: 'tokenMintXProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'userTokenAccountY';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'account';
                path: 'tokenMintYProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'poolTokenAccountX';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'account';
                path: 'tokenMintXProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'poolTokenAccountY';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'account';
                path: 'tokenMintYProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'user';
          signer: true;
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [
        {
          name: 'proofA';
          type: {
            array: ['u8', 64];
          };
        },
        {
          name: 'proofB';
          type: {
            array: ['u8', 128];
          };
        },
        {
          name: 'proofC';
          type: {
            array: ['u8', 64];
          };
        },
        {
          name: 'publicInputs';
          type: {
            array: [
              {
                array: ['u8', 32];
              },
              3
            ];
          };
        }
      ];
    },
    {
      name: 'initializePool';
      discriminator: [95, 180, 10, 172, 84, 174, 232, 40];
      accounts: [
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108];
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
          };
        },
        {
          name: 'tokenMintX';
        },
        {
          name: 'tokenMintY';
        },
        {
          name: 'tokenMintLp';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [108, 112];
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
          };
        },
        {
          name: 'metadataAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'tokenMintLp';
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'lpTokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'mplProgram';
          address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'rent';
          address: 'SysvarRent111111111111111111111111111111111';
        }
      ];
      args: [];
    },
    {
      name: 'removeLiquidity';
      discriminator: [80, 85, 209, 72, 24, 206, 177, 108];
      accounts: [
        {
          name: 'tokenMintX';
        },
        {
          name: 'tokenMintY';
        },
        {
          name: 'tokenMintXProgram';
        },
        {
          name: 'tokenMintYProgram';
        },
        {
          name: 'tokenMintLp';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [108, 112];
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
          };
        },
        {
          name: 'tokenMintLpProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108];
              },
              {
                kind: 'account';
                path: 'pool.token_mint_x';
                account: 'pool';
              },
              {
                kind: 'account';
                path: 'pool.token_mint_y';
                account: 'pool';
              }
            ];
          };
        },
        {
          name: 'userTokenAccountX';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'account';
                path: 'tokenMintXProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'userTokenAccountY';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'account';
                path: 'tokenMintYProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'userTokenAccountLp';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'user';
              },
              {
                kind: 'account';
                path: 'tokenMintLpProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintLp';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'poolTokenAccountX';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'account';
                path: 'tokenMintXProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'poolTokenAccountY';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'pool';
              },
              {
                kind: 'account';
                path: 'tokenMintYProgram';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'upgradePool';
      discriminator: [108, 204, 192, 255, 183, 148, 118, 248];
      accounts: [
        {
          name: 'pool';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [112, 111, 111, 108];
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
          };
        },
        {
          name: 'tokenMintX';
        },
        {
          name: 'tokenMintY';
        },
        {
          name: 'tokenMintLp';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [108, 112];
              },
              {
                kind: 'account';
                path: 'tokenMintX';
              },
              {
                kind: 'account';
                path: 'tokenMintY';
              }
            ];
          };
        },
        {
          name: 'metadataAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 101, 116, 97, 100, 97, 116, 97];
              },
              {
                kind: 'const';
                value: [
                  11,
                  112,
                  101,
                  177,
                  227,
                  209,
                  124,
                  69,
                  56,
                  157,
                  82,
                  127,
                  107,
                  4,
                  195,
                  205,
                  88,
                  184,
                  108,
                  115,
                  26,
                  160,
                  253,
                  181,
                  73,
                  182,
                  209,
                  188,
                  3,
                  248,
                  41,
                  70
                ];
              },
              {
                kind: 'account';
                path: 'tokenMintLp';
              }
            ];
            program: {
              kind: 'const';
              value: [
                11,
                112,
                101,
                177,
                227,
                209,
                124,
                69,
                56,
                157,
                82,
                127,
                107,
                4,
                195,
                205,
                88,
                184,
                108,
                115,
                26,
                160,
                253,
                181,
                73,
                182,
                209,
                188,
                3,
                248,
                41,
                70
              ];
            };
          };
        },
        {
          name: 'payer';
          writable: true;
          signer: true;
        },
        {
          name: 'lpTokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'mplProgram';
          address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'rent';
          address: 'SysvarRent111111111111111111111111111111111';
        }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: 'pool';
      discriminator: [241, 154, 109, 4, 17, 177, 109, 188];
    }
  ];
  events: [
    {
      name: 'confidentialSwapEvent';
      discriminator: [71, 57, 223, 200, 23, 15, 103, 112];
    },
    {
      name: 'liquidityAdded';
      discriminator: [154, 26, 221, 108, 238, 64, 217, 161];
    },
    {
      name: 'liquidityRemoved';
      discriminator: [225, 105, 216, 39, 124, 116, 169, 189];
    },
    {
      name: 'poolInitialized';
      discriminator: [100, 118, 173, 87, 12, 198, 254, 229];
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'invalidInput';
      msg: 'Invalid input';
    },
    {
      code: 6001;
      name: 'invalidProof';
      msg: 'Invalid proof';
    },
    {
      code: 6002;
      name: 'slippageExceeded';
      msg: 'Slippage tolerance exceeded';
    },
    {
      code: 6003;
      name: 'mathOverflow';
      msg: 'Math overflow';
    },
    {
      code: 6004;
      name: 'invalidGroth16Verifier';
      msg: 'Unable to create Groth16Verifier';
    },
    {
      code: 6005;
      name: 'invalidTokenOrder';
      msg: 'Invalid token order';
    },
    {
      code: 6006;
      name: 'invalidSwapAmount';
      msg: 'Invalid swap amount';
    },
    {
      code: 6007;
      name: 'invalidLpMint';
      msg: 'Invalid LP mint';
    },
    {
      code: 6008;
      name: 'invalidMetadataAccount';
      msg: 'Invalid metadata account';
    },
    {
      code: 6009;
      name: 'lpMintAlreadyInitialized';
      msg: 'LP mint already initialized';
    }
  ];
  types: [
    {
      name: 'confidentialSwapEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'amountOut';
            type: 'u64';
          },
          {
            name: 'newSqrtPrice';
            type: 'u128';
          }
        ];
      };
    },
    {
      name: 'liquidityAdded';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'amountX';
            type: 'u64';
          },
          {
            name: 'amountY';
            type: 'u64';
          },
          {
            name: 'liquidity';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'liquidityRemoved';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'amountX';
            type: 'u64';
          },
          {
            name: 'amountY';
            type: 'u64';
          },
          {
            name: 'liquidity';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'pool';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'tokenMintX';
            type: 'pubkey';
          },
          {
            name: 'tokenMintY';
            type: 'pubkey';
          },
          {
            name: 'reserveX';
            type: 'u64';
          },
          {
            name: 'reserveY';
            type: 'u64';
          },
          {
            name: 'liquidity';
            type: 'u128';
          },
          {
            name: 'bump';
            type: 'u8';
          }
        ];
      };
    },
    {
      name: 'poolInitialized';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'amount0';
            type: 'u64';
          },
          {
            name: 'amount1';
            type: 'u64';
          },
          {
            name: 'liquidity';
            type: 'u64';
          }
        ];
      };
    }
  ];
};
