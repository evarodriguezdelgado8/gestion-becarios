"use client"

import * as React from "react"
import { X, Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  selectedClassName?: string
  badgeClassName?: string
}

export function MultiSelect({ options, selected, onChange, placeholder, className, selectedClassName, badgeClassName }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(!open);
            }
          }}
          className={cn(
            // AJUSTE: Altura e igualación de estilos con el input de búsqueda
            "flex w-full items-center justify-between min-h-[38px] h-auto py-1.5 px-3",
            "bg-slate-50 border border-slate-200 rounded-lg", // Igual que el input
            "hover:bg-slate-100 transition-all cursor-pointer outline-none",
            "focus-visible:ring-2 focus-visible:ring-blue-500",
            className
          )}
        >
          <div className={cn("flex flex-wrap gap-1 max-w-[90%]", selectedClassName)}>
            {selected.length > 0 ? (
              selected.map((val) => {
                const label = options.find((o) => o.value === val)?.label;
                return (
                  <Badge 
                    key={val} 
                    variant="secondary" 
                    // AJUSTE: Badges más discretos para no romper la altura del input
                    className={cn("bg-blue-100 text-blue-700 hover:bg-blue-200 border-none max-w-[150px] flex items-center gap-1 px-2 py-0", badgeClassName)}
                  >
                    <span className="truncate text-[11px] font-medium uppercase tracking-wider">
                      {label}
                    </span>
                    <span
                      role="button"
                      className="ml-1 rounded-full outline-none hover:bg-blue-300/50 shrink-0 p-0.5 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnselect(val);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                );
              })
            ) : (
              // AJUSTE: El color y tamaño del placeholder igual al input
              <span className="text-slate-500 text-sm font-normal">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-40 ml-2 text-slate-500" />
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command className="w-full">
          <CommandInput placeholder="Buscar..." className="h-9" />
          <CommandList>
            <CommandEmpty>No hay resultados.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto p-1">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  className="rounded-md cursor-pointer text-sm"
                  onSelect={() => {
                    onChange(
                      selected.includes(option.value)
                        ? selected.filter((item) => item !== option.value)
                        : [...selected, option.value]
                    )
                  }}
                >
                  <div className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded border border-slate-300 transition-all",
                    selected.includes(option.value) 
                      ? "bg-blue-600 border-blue-600 text-white" 
                      : "bg-white opacity-50"
                  )}>
                    {selected.includes(option.value) && <Check className="h-3 w-3" />}
                  </div>
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
