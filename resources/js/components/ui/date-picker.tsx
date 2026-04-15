"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: string;
  onChange: (date: string) => void;
}

export function DatePicker({ date, onChange }: DatePickerProps) {
  // 1. Creamos un estado para controlar si el Popover está abierto o cerrado
  const [open, setOpen] = React.useState(false);

  const selectedDate = date ? new Date(date) : undefined;

  const handleSelect = (d: Date | undefined) => {
    if (d) {
      onChange(format(d, "yyyy-MM-dd"));
      // 2. Cerramos el popover inmediatamente después de seleccionar
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-[40px]",
            "bg-slate-50 border-slate-200 rounded-lg",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
            {date ? (
                format(selectedDate!, "dd/MM/yyyy") 
            ) : (
                <span>Seleccionar fecha</span>
            )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}