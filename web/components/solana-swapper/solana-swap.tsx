'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'
import { Input } from "@/components/solana-swapper/ui/input"
import { Button } from "@/components/solana-swapper/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/solana-swapper/ui/popover"
import { Slider } from "@/components/solana-swapper/ui/slider"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/solana-swapper/ui/command"
import Image from 'next/image'
import { useConfidentialSwap } from '@/lib/cyklon-swap'

interface Token {
  symbol: string;
  name: string;
  image: string;
}

const tokens: Token[] = [
  { symbol: 'SOL', name: 'Solana', image: '/images/token-icons/solana.webp' },
  { symbol: 'USDC', name: 'USD Coin', image: '/images/token-icons/usdc.webp' },
  { symbol: 'RAY', name: 'Raydium', image: '/images/token-icons/PSigc4ie_400x400.webp' },
  { symbol: 'SRM', name: 'Serum', image: '/images/token-icons/serum-logo.webp' },
  { symbol: 'PYUSD', name: 'PayPal USD', image: '/images/token-icons/PYUSD_Logo_(2).webp' },
]

export function SolanaSwapComponent() {
  const [sourceToken, setSourceToken] = useState<Token>(tokens.find(t => t.symbol === 'PYUSD') || tokens[0])
  const [destToken, setDestToken] = useState<Token>(tokens.find(t => t.symbol === 'SOL') || tokens[1])
  const [sourceAmount, setSourceAmount] = useState<string>('')
  const [destAmount, setDestAmount] = useState<string>('')
  const [slippage, setSlippage] = useState<number[]>([0.5])
  const [showSlippage, setShowSlippage] = useState<boolean>(false)
  const [isSwapping, setIsSwapping] = useState<boolean>(false)
  const [swapError, setSwapError] = useState<string | null>(null)

  const confidentialSwap = useConfidentialSwap()

  const handleSwap = () => {
    setSourceToken(destToken)
    setDestToken(sourceToken)
    setSourceAmount(destAmount)
    setDestAmount(sourceAmount)
  }

  const handleSourceAmountChange = (value: string) => {
    setSourceAmount(value)
    // Mock calculation, replace with actual swap calculation
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      setDestAmount((numValue * 0.98).toFixed(2))
    } else {
      setDestAmount('')
    }
  }

  useEffect(() => {
    handleSourceAmountChange(sourceAmount)
  }, [sourceAmount, sourceToken, destToken])

  const isValidPool = (sourceToken.symbol === 'PYUSD' && destToken.symbol === 'SOL') ||
                      (sourceToken.symbol === 'SOL' && destToken.symbol === 'PYUSD');

  const handleConfidentialSwap = async () => {
    setIsSwapping(true)
    setSwapError(null)
    try {
      const result = await confidentialSwap(sourceToken.symbol, destToken.symbol, parseFloat(sourceAmount))
      if (result.success) {
        setDestAmount(result.amount?.toString() || '')
        // Handle successful swap (e.g., show success message, update balances, etc.)
      } else {
        setSwapError(result.error || 'Swap failed')
      }
    } catch (error) {
      setSwapError('An unexpected error occurred')
    } finally {
      setIsSwapping(false)
    }
  }

  return (
    <div className="flex justify-center items-center text-white">
      <div className="w-96 p-6 rounded-lg bg-base-200 shadow-xl overflow-auto">
        <h2 className="text-2xl font-base mb-6">Swap Tokens</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <TokenSelect
              tokens={tokens}
              selectedToken={sourceToken}
              onSelect={setSourceToken}
              disabledToken={destToken}
            />
            <Input
              type="number"
              value={sourceAmount}
              onChange={(e) => handleSourceAmountChange(e.target.value)}
              placeholder="0.00"
              className="flex-grow bg-base-300 border-base-300 text-right"
            />
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
          <div className="flex items-center space-x-2">
            <TokenSelect
              tokens={tokens}
              selectedToken={destToken}
              onSelect={setDestToken}
              disabledToken={sourceToken}
            />
            <Input
              type="number"
              value={destAmount}
              readOnly
              placeholder="0.00"
              className="flex-grow bg-base-300 border-base-300 text-right cursor-not-allowed"
            />
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
            className={`w-full ${isValidPool ? 'bg-[#a1a1aa] hover:bg-[#a1a1aa]/90' : 'bg-gray-500 cursor-not-allowed'} text-primary-content`}
            disabled={!isValidPool || isSwapping}
            onClick={handleConfidentialSwap}
          >
            {isSwapping ? 'Swapping...' : isValidPool ? 'Swap' : 'This pool isn\'t available yet.'}
          </Button>
          {swapError && <div className="text-red-500 text-sm">{swapError}</div>}
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
          className="w-[120px] justify-between bg-base-300 border-base-300 hover:bg-base-100"
        >
          <div className="flex items-center">
            <Image
              src={selectedToken.image}
              alt={selectedToken.name}
              width={20}
              height={20}
              className="mr-2 rounded-full"
            />
            {selectedToken?.symbol || 'Select Token'}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-base-200 border-base-300">
        {tokens && tokens.length > 0 ? (
          <Command>
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
                  className={`hover:bg-base-300 ${token.symbol === disabledToken.symbol ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={token.symbol === disabledToken.symbol}
                >
                  <div className="flex items-center">
                    <Image
                      src={token.image}
                      alt={token.name}
                      width={20}
                      height={20}
                      className="mr-2 rounded-full"
                    />
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
  )
}