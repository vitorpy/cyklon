'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import Image from "next/image"
import { useWallet, useConnection, useAnchorWallet } from '@solana/wallet-adapter-react'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import { Token } from '@/types/token'
import tokenList from '@/constants/tokens.json'
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { createSyncNativeInstruction, getAssociatedTokenAddress, NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { AnchorProvider, BN } from '@coral-xyz/anchor'
import { useTransactionToast, useErrorToast } from '@/hooks/useToast'
import { getCyklonProgram } from '@blackpool/anchor';
import { usePostHog } from 'posthog-js/react'

const tokens: Token[] = tokenList;

export function LiquidityManager() {
  const [pair, setPair] = useState<{ tokenX: Token; tokenY: Token }>({
    tokenX: tokens.find(t => t.symbol === 'PYUSD') || tokens[0],
    tokenY: tokens.find(t => t.symbol === 'SOL') || tokens[1]
  });
  const [lpTokens] = useState<string>('0');
  const [inputLpTokens, setInputLpTokens] = useState<string>('');
  const [isAdding, setIsAdding] = useState<boolean>(true);

  const { publicKey } = useWallet();
  const { balance: tokenXBalance } = useTokenBalance(publicKey, pair.tokenX.address);
  const { balance: tokenYBalance } = useTokenBalance(publicKey, pair.tokenY.address);
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const transactionToast = useTransactionToast();
  const errorToast = useErrorToast();
  const posthog = usePostHog()

  const handleAddRemoveLiquidity = async () => {
    if (!wallet || !wallet.publicKey) return;

    const provider = new AnchorProvider(connection, wallet);
    const program = getCyklonProgram(provider);

    const tokenX = new PublicKey(pair.tokenX.address === 'NATIVE' ? NATIVE_MINT : pair.tokenX.address);
    const tokenY = new PublicKey(pair.tokenY.address === 'NATIVE' ? NATIVE_MINT : pair.tokenY.address);

    const tokenXProgram = pair.tokenX.tokenProgram === 'SPL-Token' ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;
    const tokenYProgram = pair.tokenY.tokenProgram === 'SPL-Token' ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

    const isXNative = pair.tokenX.address === 'NATIVE';
    const isYNative = pair.tokenY.address === 'NATIVE';

    const tokenLpProgram = isXNative || isYNative ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

    try {
      const [poolPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), tokenX.toBuffer(), tokenY.toBuffer()],
        program.programId
      );

      const [lpMintPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("lp"), tokenX.toBuffer(), tokenY.toBuffer()],
        program.programId
      );

      const userTokenAccountX = await getAssociatedTokenAddress(
        tokenX,
        wallet.publicKey,
        false,
        tokenXProgram
      );

      const userTokenAccountY = await getAssociatedTokenAddress(
        tokenY,
        wallet.publicKey,
        false,
        tokenYProgram
      );

      const userTokenAccountLp = await getAssociatedTokenAddress(
        lpMintPubkey,
        wallet.publicKey,
        false,
        tokenLpProgram
      );

      const poolTokenAccountX = await getAssociatedTokenAddress(
        tokenX,
        poolPubkey,
        true,
        tokenXProgram
      );

      const poolTokenAccountY = await getAssociatedTokenAddress(
        tokenY,
        poolPubkey,
        true,
        tokenYProgram
      );

      const tx = new Transaction();

      // Adding liquidity
      const amountX = new BN(parseFloat(inputLpTokens) * Math.pow(10, pair.tokenX.decimals));
      const amountY = new BN(parseFloat(inputLpTokens) * Math.pow(10, pair.tokenY.decimals));

      if (isAdding) {
        if (isXNative) {
            // Wrap SOL to WSOL before adding liquidity
            const wrapSolIx = SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: userTokenAccountX,
              lamports: amountX.toNumber(),
            });

            const syncNativeIx = await createSyncNativeInstruction(userTokenAccountX);

            tx.add(wrapSolIx, syncNativeIx);

        } else if (isYNative) {
            // Wrap SOL to WSOL before adding liquidity
            const wrapSolIx = SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: userTokenAccountY,
              lamports: amountY.toNumber(),
            });

            const syncNativeIx = await createSyncNativeInstruction(userTokenAccountY);

            tx.add(wrapSolIx, syncNativeIx);
        }

        const addLiquidityIx = await program.methods
          .addLiquidity(amountX, amountY)
          .accounts({
            tokenMintX: tokenX,
            tokenMintY: tokenY,
            tokenMintXProgram: tokenXProgram,
            tokenMintYProgram: tokenYProgram,
            // @ts-expect-error Anchor being Anchor.
            tokenMintLpProgram: tokenLpProgram,
            pool: poolPubkey,
            userTokenAccountX,
            userTokenAccountY,
            poolTokenAccountX,
            poolTokenAccountY,
            user: wallet.publicKey,
          })
          .transaction();

        tx.add(addLiquidityIx);
      } else {
        // Removing liquidity
        const lpTokensToRemove = new BN(parseFloat(inputLpTokens) * Math.pow(10, 9));

        const removeLiquidityIx = await program.methods
          .removeLiquidity(lpTokensToRemove)
          .accounts({
            tokenMintX: tokenX,
            tokenMintY: tokenY,
            tokenMintXProgram: tokenXProgram,
            tokenMintYProgram: tokenYProgram,
            // @ts-expect-error Anchor being Anchor.
            tokenMintLpProgram: tokenLpProgram,
            pool: poolPubkey,
            userTokenAccountX,
            userTokenAccountY,
            userTokenAccountLp,
            poolTokenAccountX,
            poolTokenAccountY,
            user: wallet.publicKey,
          })
          .transaction();

        if (isXNative || isYNative) {
          // Unwrap WSOL to SOL after removing liquidity
          const unwrapSolIx = SystemProgram.transfer({
            fromPubkey: userTokenAccountX,
            toPubkey: wallet.publicKey,
            lamports: amountX.toNumber(),
          });

          tx.add(unwrapSolIx);
        }

        tx.add(removeLiquidityIx);
      }

      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = wallet.publicKey;

      const signedTx = await wallet.signTransaction(tx);
      const txId = await connection.sendRawTransaction(signedTx.serialize());

      // Capture event for successful liquidity add/remove
      posthog.capture(`liquidity_${isAdding ? 'add' : 'remove'}_success`, {
        tokenX: pair.tokenX.symbol,
        tokenY: pair.tokenY.symbol,
        amount: inputLpTokens,
        txId,
      })

      await connection.confirmTransaction(txId);
      transactionToast(txId);

      console.log(`${isAdding ? 'Added' : 'Removed'} liquidity: ${inputLpTokens} LP tokens`);
    } catch (error) {
      console.error("Error managing liquidity:", error);
      
      // Capture event for failed liquidity add/remove
      posthog.capture(`liquidity_${isAdding ? 'add' : 'remove'}_failed`, {
        tokenX: pair.tokenX.symbol,
        tokenY: pair.tokenY.symbol,
        amount: inputLpTokens,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      // Handle error (e.g., show an error message to the user)
      errorToast(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  useEffect(() => {
    setIsAdding(parseFloat(inputLpTokens) > parseFloat(lpTokens))
  }, [inputLpTokens, lpTokens]);

  return (
    <div className="flex justify-center items-center text-white cursor-default">
      <div className="w-96 p-6 rounded-lg bg-base-200 shadow-xl overflow-auto">
        <h2 className="text-2xl font-base mb-6">Manage Liquidity</h2>
        <div className="space-y-4">
          <PairSelector pair={pair} setPair={setPair} />
          
          <div className="text-sm text-gray-400">
            Current LP tokens: {lpTokens}
          </div>
          
          <Input
            type="number"
            value={inputLpTokens}
            onChange={(e) => setInputLpTokens(e.target.value)}
            placeholder="Number of LP Tokens"
            className="w-full bg-base-300 border-base-300"
          />
          
          <div className="bg-base-300 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Description:</h3>
            <p>{pair.tokenX.symbol} token {tokenXBalance}</p>
            <p>{pair.tokenY.symbol} token {tokenYBalance}</p>
          </div>
          
          <Button 
            className="w-full bg-[#a1a1aa] hover:bg-[#71717a] text-primary-content"
            onClick={handleAddRemoveLiquidity}
            disabled={!inputLpTokens || isNaN(parseFloat(inputLpTokens)) || parseFloat(inputLpTokens) <= 0}
          >
            {isAdding ? 'Add Liquidity' : 'Remove Liquidity'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PairSelectorProps {
  pair: { tokenX: Token; tokenY: Token };
  setPair: (pair: { tokenX: Token; tokenY: Token }) => void;
}

function PairSelector({ pair, setPair }: PairSelectorProps) {
  const [open, setOpen] = useState(false);

  // Calculate all possible pairs
  const tokenPairs = tokens.flatMap((tokenX, index) => 
    tokens.slice(index + 1).map(tokenY => {
      // Ensure consistent ordering of tokens in pair
      const [first, second] = [tokenX, tokenY].sort((a, b) => a.address.localeCompare(b.address));
      return { tokenX: first, tokenY: second };
    })
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-base-300 border-base-300 hover:bg-[#71717a]"
        >
          <div className="flex items-center">
            <Image
              src={pair.tokenX.image}
              alt={pair.tokenX.name}
              width={20}
              height={20}
              className="mr-2 rounded-full"
              style={{ maxWidth: "100%", height: "auto" }}
            />
            <Image
              src={pair.tokenY.image}
              alt={pair.tokenY.name}
              width={20}
              height={20}
              className="mr-2 rounded-full"
              style={{ maxWidth: "100%", height: "auto" }}
            />
            <span className="truncate">Pair {pair.tokenX.symbol}/{pair.tokenY.symbol}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-base-200 border-base-300">
        <Command>
          <CommandInput placeholder="Search pair..." className="h-9 bg-base-200" />
          <CommandEmpty>No pair found.</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {tokenPairs.map(({ tokenX, tokenY }) => (
                <CommandItem
                  key={`${tokenX.symbol}-${tokenY.symbol}`}
                  onSelect={() => {
                    setPair({ tokenX, tokenY })
                    setOpen(false)
                  }}
                  className="hover:bg-[#a1a1aa]"
                >
                  <div className="flex items-center">
                    <Image
                      src={tokenX.image}
                      alt={tokenX.name}
                      width={20}
                      height={20}
                      className="mr-1 rounded-full"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                    <Image
                      src={tokenY.image}
                      alt={tokenY.name}
                      width={20}
                      height={20}
                      className="mr-2 rounded-full"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                    {tokenX.symbol}/{tokenY.symbol}
                  </div>
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
