
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Button } from "./button"
import { Copy } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const descriptionText = typeof description === 'string' ? description : '';

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <div className="flex items-center gap-2">
                  <ToastDescription>{description}</ToastDescription>
                  {props.variant === 'destructive' && descriptionText && (
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleCopy(descriptionText)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                  )}
                </div>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
