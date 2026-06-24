"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface CategoryFilterProps {
  categories: string[];
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onChange,
}: CategoryFilterProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (category: string) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter((c) => c !== category));
    } else {
      onChange([...selectedCategories, category]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full md:w-[300px] justify-between bg-white justify-start text-left font-normal"
        >
          <div className="flex items-center gap-2 truncate">
            <Filter className="h-4 w-4 shrink-0 opacity-50" />
            {selectedCategories.length === 0 ? (
              <span className="text-muted-foreground">Filtra per categoria...</span>
            ) : (
              <div className="flex gap-1 items-center overflow-hidden">
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  {selectedCategories.length} selezionate
                </Badge>
              </div>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cerca categoria..." />
          <CommandList>
            <CommandEmpty>Nessuna categoria trovata.</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <CommandItem
                    key={category}
                    value={category}
                    onSelect={() => handleSelect(category)}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleSelect(category)}
                      onClick={(e) => e.stopPropagation()} // Previene doppi click indesiderati
                    />
                    <span className="flex-1 truncate">{category}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {selectedCategories.length > 0 && (
            <div className="border-t p-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-muted-foreground hover:text-destructive"
                onClick={handleClear}
              >
                Svuota filtri
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}