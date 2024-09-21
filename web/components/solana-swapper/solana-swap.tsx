'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react'
import { Input } from "@/components/solana-swapper/ui/input"
import { Button } from "@/components/solana-swapper/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/solana-swapper/ui/popover"
import { Slider } from "@/components/solana-swapper/ui/slider"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/solana-swapper/ui/command"

interface Token {
  symbol: string;
  name: string;
}

const tokens: Token[] = [
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'RAY', name: 'Raydium' },
  { symbol: 'SRM', name: 'Serum' },
]

export function SolanaSwapComponent() {
  const [sourceToken, setSourceToken] = useState<Token>(tokens[0])
  const [destToken, setDestToken] = useState<Token>(tokens[1])
  const [sourceAmount, setSourceAmount] = useState<string>('')
  const [destAmount, setDestAmount] = useState<string>('')
  const [slippage, setSlippage] = useState<number[]>([0.5])
  const [showSlippage, setShowSlippage] = useState<boolean>(false)

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
            />
            <Input
              type="number"
              value={sourceAmount}
              onChange={(e) => handleSourceAmountChange(e.target.value)}
              placeholder="0.00"
              className="flex-grow bg-base-300 border-base-300"
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
            />
            <Input
              type="number"
              value={destAmount}
              readOnly
              placeholder="0.00"
              className="flex-grow bg-base-300 border-base-300"
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
          <Button className="w-full bg-[#a1a1aa] text-primary-content hover:bg-[#a1a1aa]/90">
            Swap
          </Button>
        </div>
      </div>
    </div>
  )
}

interface TokenSelectProps {
  tokens: Token[];
  selectedToken: Token;
  onSelect: (token: Token) => void;
}

function TokenSelect({ tokens, selectedToken, onSelect }: TokenSelectProps) {
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
          {selectedToken.symbol}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-base-200 border-base-300">
        <Command>
          <CommandInput placeholder="Search token..." className="h-9 bg-base-200" />
          <CommandEmpty>No token found.</CommandEmpty>
          <CommandGroup>
            {tokens.map((token) => (
              <CommandItem
                key={token.symbol}
                onSelect={() => {
                  onSelect(token)
                  setOpen(false)
                }}
                className="hover:bg-base-300"
              >
                {token.symbol} - {token.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}