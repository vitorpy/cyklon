'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import Image from "next/image"
import { useConfidentialSwap } from '@/lib/cyklon-swap'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createAssociatedTokenAccountInstruction, createSyncNativeInstruction, NATIVE_MINT, createCloseAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useTokenBalance } from '@/hooks/useTokenBalance'
import * as Sentry from "@sentry/nextjs";
import Link from 'next/link';
import { useCluster } from '@/components/cluster/cluster-data-access';
import { useSwapEstimate } from '@/hooks/useSwapEstimate';
import { Token } from '@/types/token';
import tokenList from '@/constants/tokens.json';
import { usePostHog } from 'posthog-js/react'

const tokens: Token[] = tokenList;

export function SolanaSwapComponent() {
  const [sourceToken, setSourceToken] = useState<Token>(tokens.find(t => t.symbol === 'PYUSD') || tokens[0])
  const [destToken, setDestToken] = useState<Token>(tokens.find(t => t.symbol === 'SOL') || tokens[1])
  const [sourceAmount, setSourceAmount] = useState<string>('')
  const [destAmount, setDestAmount] = useState<string>('')
  const [slippage, setSlippage] = useState<number[]>([0.5])
  const [showSlippage, setShowSlippage] = useState<boolean>(false)
  const [isSwapping, setIsSwapping] = useState<boolean>(false)
  const [swapError, setSwapError] = useState<string | null>(null)
  const [minReceived, setMinReceived] = useState<number>(0)
  const [swapSuccess, setSwapSuccess] = useState<string | null>(null)

  const { publicKey } = useWallet()
  const { balance: sourceTokenBalance } = useTokenBalance(publicKey, sourceToken.address)
  const { connection } = useConnection()
  const wallet = useWallet()
  const { cluster } = useCluster()

  const confidentialSwap = useConfidentialSwap()
  const posthog = usePostHog()

  const estimatedDestAmount = useSwapEstimate(sourceToken, destToken, sourceAmount);

  const handleSwap = () => {
    setSourceToken(destToken)
    setDestToken(sourceToken)
    setSourceAmount(destAmount)
    setDestAmount(sourceAmount)
  }

  const handleSourceAmountChange = (value: string) => {
    setSourceAmount(value);
    if (estimatedDestAmount) {
      setDestAmount(estimatedDestAmount);
      const numValue = parseFloat(estimatedDestAmount);
      setMinReceived(numValue * (1 - slippage[0] / 100));
    } else {
      setDestAmount('');
      setMinReceived(0);
    }
  };

  useEffect(() => {
    if (estimatedDestAmount) {
      setDestAmount(estimatedDestAmount);
      const numValue = parseFloat(estimatedDestAmount);
      setMinReceived(numValue * (1 - slippage[0] / 100));
    }
  }, [estimatedDestAmount, slippage]);

  const isValidPool = (sourceToken.symbol === 'PYUSD' && destToken.symbol === 'SOL') ||
                      (sourceToken.symbol === 'SOL' && destToken.symbol === 'PYUSD');

  const handleConfidentialSwap = async () => {
    setIsSwapping(true);
    setSwapError(null);
    setSwapSuccess(null);

    // Track swap button click
    posthog.capture('swap_button_clicked', {
      sourceToken: sourceToken.symbol,
      destToken: destToken.symbol,
      sourceAmount,
      destAmount,
      slippage: slippage[0],
    })

    try {
      if (!publicKey) throw new Error('Wallet not connected');

      const sourceTokenPublicKey = sourceToken.address === 'NATIVE' ? NATIVE_MINT : new PublicKey(sourceToken.address);
      const destTokenPublicKey = destToken.address === 'NATIVE' ? NATIVE_MINT : new PublicKey(destToken.address);
      
      const transaction = new Transaction();
      let wrappedSolAccount: PublicKey | null = null;

      console.log('Starting confidential swap process');
      console.log('Source token:', sourceToken.symbol, sourceTokenPublicKey.toBase58());
      console.log('Destination token:', destToken.symbol, destTokenPublicKey.toBase58());

      // Wrap SOL if the source token is native SOL
      if (sourceToken.address === 'NATIVE') {
        console.log('Wrapping SOL');
        wrappedSolAccount = await getAssociatedTokenAddress(NATIVE_MINT, publicKey);
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            wrappedSolAccount,
            publicKey, // owner
            NATIVE_MINT
          ),
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: wrappedSolAccount,
            lamports: LAMPORTS_PER_SOL * parseFloat(sourceAmount)
          }),
          createSyncNativeInstruction(wrappedSolAccount)
        );
        console.log('Added SOL wrapping instructions');
      }

      // Check and create associated token account for destination token if needed
      const destTokenAccount = await getAssociatedTokenAddress(destTokenPublicKey, publicKey);
      let destTokenAccountInfo;
      try {
        destTokenAccountInfo = await connection.getAccountInfo(destTokenAccount);
      } catch (error) {
        destTokenAccountInfo = null;
      }
      
      if (!destTokenAccountInfo) {
        console.log('Creating associated token account for destination token');
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            destTokenAccount,
            publicKey, // owner
            destTokenPublicKey
          )
        );
        console.log('Added create associated token account instruction');
      }

      // Add confidential swap instruction
      const sourceAmountInteger = BigInt(Math.floor(parseFloat(sourceAmount) * 10 ** sourceToken.decimals));
      const minReceivedInteger = BigInt(Math.floor(minReceived * 10 ** destToken.decimals));

      console.log('Preparing confidential swap');
      console.log('Source amount:', sourceAmountInteger.toString());
      console.log('Min received:', minReceivedInteger.toString());

      // The proof generation is now handled within prepareConfidentialSwap
      const result = await confidentialSwap(
        sourceTokenPublicKey,
        destTokenPublicKey,
        sourceAmountInteger,
        1n, //minReceivedInteger,
        sourceToken.tokenProgram,
        destToken.tokenProgram,
        sourceToken.decimals,
        destToken.decimals
      );

      if (!result.success || !result.transaction) {
        throw new Error(result.error || 'Swap failed');
      }

      console.log('Confidential swap preparation successful');
      transaction.add(result.transaction);
      console.log('Added confidential swap instruction');

      // Unwrap SOL if the destination token is native SOL
      if (destToken.address === 'NATIVE') {
        console.log('Adding SOL unwrapping instruction');
        const wrappedSolAccount = await getAssociatedTokenAddress(NATIVE_MINT, publicKey);
        transaction.add(
          createCloseAccountInstruction(
            wrappedSolAccount,
            publicKey, // owner
            publicKey  // destination
          )
        );
        console.log('Added SOL unwrapping instruction');
      }

      console.log('Transaction built. Instruction count:', transaction.instructions.length);
      console.log('Sending transaction...');

      // Send and confirm the transaction
      let signature;
      try {
        signature = await wallet.sendTransaction(transaction, connection);
        console.log('Transaction sent. Signature:', signature);
      } catch (error) {
        console.error('Transaction submission failed:', error);

        const simulation = await connection.simulateTransaction(transaction);
        console.log('Transaction simulation:', simulation);

        throw error;
      }

      try {
        await connection.confirmTransaction(signature, 'confirmed');
        console.log('Transaction confirmed:', signature);
      } catch (error) {
        console.error('Transaction confirmation failed:', error);
        
        const simulation = await connection.simulateTransaction(transaction);
        console.log('Transaction simulation:', simulation);

        throw error;
      }
      
      // Handle successful swap
      console.log('Swap successful');
      setSwapSuccess(signature);

      // Track successful swap
      posthog.capture('swap_successful', {
        sourceToken: sourceToken.symbol,
        destToken: destToken.symbol,
        sourceAmount,
        destAmount,
        slippage: slippage[0],
        signature,
      })

    } catch (error) {
      console.error('Swap error:', error);
      setSwapError(error instanceof Error ? error.message : 'An unexpected error occurred');

      // Track failed swap
      posthog.capture('swap_failed', {
        sourceToken: sourceToken.symbol,
        destToken: destToken.symbol,
        sourceAmount,
        destAmount,
        slippage: slippage[0],
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      })

      // Sentry error reporting
      Sentry.captureException(error, {
        tags: {
          sourceToken: sourceToken.symbol,
          destToken: destToken.symbol,
        },
        extra: {
          sourceAmount,
          destAmount,
          minReceived,
          slippage: slippage[0],
          publicKey: publicKey?.toString(),
          isValidPool,
        },
      });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="flex justify-center items-center text-white cursor-default">
      <div className="w-96 p-6 rounded-lg bg-base-200 shadow-xl overflow-auto">
        <h2 className="text-2xl font-base mb-6">Swap Tokens</h2>
        <div className="space-y-4">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-400">Balance:</span>
              <span className="text-sm">{sourceTokenBalance?.toFixed(4) || '0'} {sourceToken.symbol}</span>
            </div>
            <div className="flex items-center">
              <div className="w-2/5 pr-2">
                <TokenSelect
                  tokens={tokens}
                  selectedToken={sourceToken}
                  onSelect={setSourceToken}
                  disabledToken={destToken}
                />
              </div>
              <div className="w-3/5">
                <Input
                  type="number"
                  value={sourceAmount}
                  onChange={(e) => handleSourceAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-base-300 border-base-300 text-right"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwap}
              className="rounded-full bg-base-300 hover:bg-base-100"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center">
            <div className="w-2/5 pr-2">
              <TokenSelect
                tokens={tokens}
                selectedToken={destToken}
                onSelect={setDestToken}
                disabledToken={sourceToken}
              />
            </div>
            <div className="w-3/5">
              <Input
                type="number"
                value={destAmount}
                readOnly
                placeholder="0.00"
                className="w-full bg-base-300 border-base-300 text-right cursor-not-allowed"
              />
            </div>
          </div>
          <Popover open={showSlippage} onOpenChange={setShowSlippage}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-base-300 border-base-300 hover:bg-base-100"
              >
                Slippage: {slippage[0].toFixed(1)}%
                {showSlippage ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-base-200 border-base-300">
              <div className="space-y-2">
                <h3 className="font-medium">Adjust Slippage</h3>
                <Slider
                  value={slippage}
                  onValueChange={(value) => setSlippage(value)}
                  max={5}
                  step={0.1}
                  className="bg-base-300"
                />
                <div className="text-sm text-base-content">
                  Current slippage: {slippage[0].toFixed(1)}%
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            className={`w-full ${isValidPool ? 'bg-[#a1a1aa] hover:bg-[#71717a]' : 'bg-gray-500 cursor-not-allowed'} text-primary-content`}
            disabled={!isValidPool || isSwapping || !sourceAmount || isNaN(parseFloat(sourceAmount)) || parseFloat(sourceAmount) <= 0}
            onClick={handleConfidentialSwap}
          >
            {isSwapping ? 'Swapping...' : isValidPool ? 'Swap' : 'This pool isn\'t available yet.'}
          </Button>
          {swapError && <div className="text-red-500 text-sm">{swapError}</div>}
          {swapSuccess && (
            <div className="text-white text-sm mt-2">
              Swap successful!{' '}
              <Link 
                href={`https://explorer.solana.com/tx/${swapSuccess}?cluster=${cluster.network}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-300"
              >
                View transaction
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface TokenSelectProps {
  tokens: Token[];
  selectedToken: Token;
  onSelect: (token: Token) => void;
  disabledToken: Token;
}

function TokenSelect({ tokens, selectedToken, onSelect, disabledToken }: TokenSelectProps) {
  const [open, setOpen] = useState(false)

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
              src={selectedToken.image}
              alt={selectedToken.name}
              width={20}
              height={20}
              className="mr-2 rounded-full"
              style={{
                maxWidth: "100%",
                height: "auto"
              }} />
            <span className="truncate">{selectedToken?.symbol || 'Select Token'}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-base-200 border-base-300">
        {tokens && tokens.length > 0 ? (
          <Command value={selectedToken.symbol}>
            <CommandInput placeholder="Search token..." className="h-9 bg-base-200" />
            <CommandEmpty>No token found.</CommandEmpty>
            <CommandGroup>
              <CommandList>
              {tokens.map((token) => (
                <CommandItem
                  key={token.symbol}
                  value={token.symbol}
                  onSelect={() => {
                    onSelect(token)
                    setOpen(false)
                  }}
                  className={`hover:bg-[#a1a1aa] ${token.symbol === disabledToken.symbol ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={token.symbol === disabledToken.symbol}
                >
                  <div className="flex items-center">
                    <Image
                      src={token.image}
                      alt={token.name}
                      width={20}
                      height={20}
                      className="mr-2 rounded-full"
                      style={{
                        maxWidth: "100%",
                        height: "auto"
                      }} />
                    {token.symbol} - {token.name}
                  </div>
                </CommandItem>
              ))}
              </CommandList>
            </CommandGroup>
          </Command>
        ) : (
          <div className="p-2 text-sm text-gray-500">No tokens available</div>
        )}
      </PopoverContent>
    </Popover>
  );
}