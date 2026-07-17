import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonGroupVariants = cva("inline-flex", {
  variants: {
    variant: {
      default: "[--button-radius:var(--radius)]",
      outline: "[--button-radius:var(--radius)]",
      ghost: "[--button-radius:var(--radius)]",
    },
    size: {
      default: "",
      sm: "",
      lg: "",
      icon: "",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
})

function ButtonGroup({ className, variant, size, ...props }: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return <div data-slot="button-group" className={cn(buttonGroupVariants({ variant, size }), "isolate inline-flex rounded-md shadow-sm", className)} {...props} />
}

export { ButtonGroup, buttonGroupVariants }
