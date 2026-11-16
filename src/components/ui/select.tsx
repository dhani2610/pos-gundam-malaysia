"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

function extractTextFromNode(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).join(" ");
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    return extractTextFromNode(props.children);
  }
  return "";
}

function collectSelectItems(
  children: React.ReactNode,
  map: Map<string, React.ReactNode>
) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as {
      value?: string;
      children?: React.ReactNode;
    };
    if (
      typeof props.value === "string" &&
      (child.type as any)?.displayName === "SelectItem"
    ) {
      map.set(props.value, props.children);
    } else if (props.children) {
      collectSelectItems(props.children, map);
    }
  });
}

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled?: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  itemsMap: Map<string, React.ReactNode>;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) {
    throw new Error("Select components must be used within <Select>");
  }
  return ctx;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  value: controlledValue,
  defaultValue,
  onValueChange,
  disabled,
  children,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? ""
  );
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  const itemsMap = React.useMemo(() => {
    const map = new Map<string, React.ReactNode>();
    collectSelectItems(children, map);
    return map;
  }, [children]);

  const handleValueChange = React.useCallback(
    (nextVal: string) => {
      if (!isControlled) {
        setUncontrolledValue(nextVal);
      }
      if (onValueChange) {
        onValueChange(nextVal);
      }
      setOpen(false);
      setSearchQuery("");
    },
    [isControlled, onValueChange]
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (disabled) return;
      setOpen(nextOpen);
      if (!nextOpen) {
        setSearchQuery("");
      }
    },
    [disabled]
  );

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        setOpen: handleOpenChange,
        disabled,
        searchQuery,
        setSearchQuery,
        itemsMap,
      }}
    >
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        {children}
      </PopoverPrimitive.Root>
    </SelectContext.Provider>
  );
};

const SelectGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

const SelectValue: React.FC<{ placeholder?: string; className?: string }> = ({
  placeholder = "Select option...",
  className,
}) => {
  const { value, itemsMap } = useSelectContext();
  const selectedLabel = value !== undefined ? itemsMap.get(String(value)) : null;

  if (selectedLabel !== undefined && selectedLabel !== null && value !== "") {
    return (
      <span className={cn("truncate block min-w-0 flex-1", className)}>
        {selectedLabel}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-muted-foreground truncate block min-w-0 flex-1",
        className
      )}
    >
      {placeholder}
    </span>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { disabled, open } = useSelectContext();
  return (
    <PopoverPrimitive.Trigger asChild>
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full min-w-0 max-w-full overflow-hidden items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-2xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-left transition-colors hover:border-blue-300",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-60 shrink-0 ml-2" />
      </button>
    </PopoverPrimitive.Trigger>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    position?: "popper" | "item-aligned";
  }
>(({ className, children, align = "start", sideOffset = 4, ...props }, ref) => {
  const { searchQuery, setSearchQuery } = useSelectContext();

  // Filter children to check if any SelectItem matches
  let matchCount = 0;
  const countMatches = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return;
      const cProps = child.props as {
        value?: string;
        children?: React.ReactNode;
      };
      if ((child.type as any)?.displayName === "SelectItem") {
        const text = extractTextFromNode(cProps.children).toLowerCase();
        const val = String(cProps.value || "").toLowerCase();
        const q = searchQuery.trim().toLowerCase();
        if (!q || text.includes(q) || val.includes(q)) {
          matchCount++;
        }
      } else if (cProps.children) {
        countMatches(cProps.children);
      }
    });
  };
  countMatches(children);

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[var(--radix-popover-trigger-width)] w-full max-w-[360px] overflow-hidden rounded-xl border border-blue-100 bg-popover text-popover-foreground shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        onOpenAutoFocus={(e) => {
          // Let the search input focus naturally
          e.preventDefault();
        }}
        {...props}
      >
        {/* Search Input Bar inside every Select Dropdown */}
        <div className="flex items-center border-b border-blue-100 bg-blue-50/40 px-2.5 py-2">
          <Search className="h-3.5 w-3.5 text-blue-600 shrink-0 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search option..."
            autoFocus
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="max-h-60 overflow-y-auto p-1">
          {children}
          {matchCount === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No matching options found
            </div>
          )}
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
});
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

export interface SelectItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value: itemValue, disabled, ...props }, ref) => {
    const { value, onValueChange, searchQuery } = useSelectContext();
    const isSelected = String(value) === String(itemValue);

    const text = extractTextFromNode(children).toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    if (q && !text.includes(q) && !String(itemValue).toLowerCase().includes(q)) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        onClick={() => {
          if (!disabled && onValueChange) {
            onValueChange(itemValue);
          }
        }}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-2.5 pr-8 text-xs outline-none transition-colors",
          isSelected
            ? "bg-blue-600 text-white font-semibold"
            : "hover:bg-blue-50 text-slate-700 hover:text-blue-700",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        {...props}
      >
        <span className="truncate block">{children}</span>
        {isSelected && (
          <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
