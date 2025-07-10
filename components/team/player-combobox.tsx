"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Player } from "@/lib/types"

interface PlayerComboboxProps {
  players: Player[]
  value?: string
  onChange: (value: string) => void
  className?: string
}

export function PlayerCombobox({ players, value, onChange, className }: PlayerComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const options = players.map((p) => ({ label: p.name, value: p.id }))

  const selectedLabel = React.useMemo(() => {
    if (!value) return "Select player..."
    const existingPlayer = options.find((option) => option.value === value)
    return existingPlayer ? existingPlayer.label : value
  }, [value, options])

  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()))

  const showCreateOption =
    searchQuery && !filteredOptions.some((option) => option.label.toLowerCase() === searchQuery.toLowerCase())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command
          filter={(value, search) => {
            // Allow custom filtering logic if needed, or just return 1 to show all and handle in React state
            return 1
          }}
        >
          <CommandInput
            placeholder="Search player or type to add..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>{!showCreateOption && "No player found."}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.value)
                    setSearchQuery("")
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option.value ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem
                  value={searchQuery}
                  onSelect={() => {
                    onChange(searchQuery) // Pass the new name as the value
                    setSearchQuery("")
                    setOpen(false)
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create "{searchQuery}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
