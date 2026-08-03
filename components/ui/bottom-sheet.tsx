'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'

/**
 * Por padrão, o Portal do diálogo renderiza direto em <body>, fora de
 * qualquer escopo de CSS vars (ex.: .gt-light). Telas que precisam de um
 * tema escopado passam seu próprio nó via SheetPortalContainer para que os
 * sheets herdem as variáveis certas em vez de sempre cair no tema escuro.
 */
const SheetPortalContainerContext = createContext<HTMLElement | null>(null)

export function SheetPortalContainer({
  container,
  children,
}: {
  container: HTMLElement | null
  children: ReactNode
}) {
  return (
    <SheetPortalContainerContext.Provider value={container}>
      {children}
    </SheetPortalContainerContext.Provider>
  )
}

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

export function BottomSheet({ open, onOpenChange, title, description, children }: BottomSheetProps) {
  const container = useContext(SheetPortalContainerContext)
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal container={container ?? undefined}>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px] data-open:animate-in data-open:fade-in data-closed:animate-out data-closed:fade-out" />
        <DialogPrimitive.Popup className="fixed inset-x-0 bottom-0 z-[51] mx-auto max-h-[88dvh] w-full max-w-[560px] overflow-hidden rounded-t-[24px] border border-b-0 border-input bg-card text-foreground shadow-2xl outline-none data-open:animate-in data-open:slide-in-from-bottom-8 data-closed:animate-out data-closed:slide-out-to-bottom-8">
          <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-input" />
          <header className="flex items-start gap-3 border-b border-sidebar-border px-4 pb-3 pt-3">
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-base font-extrabold">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="mt-1 text-xs text-muted-foreground">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="grid size-9 shrink-0 place-items-center rounded-xl border border-input text-muted-foreground hover:text-foreground">
              <X className="size-4" />
              <span className="sr-only">Fechar</span>
            </DialogPrimitive.Close>
          </header>
          <div className="max-h-[calc(88dvh-82px)] overflow-y-auto px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-4">
            {children}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
