"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border/80 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl group-[.toaster]:p-4",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium rounded-lg text-xs",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground rounded-lg text-xs",
          success: "group-[.toaster]:border-emerald-500/40 group-[.toaster]:text-emerald-400",
          error: "group-[.toaster]:border-red-500/40 group-[.toaster]:text-red-400",
          warning: "group-[.toaster]:border-amber-500/40 group-[.toaster]:text-amber-400",
          info: "group-[.toaster]:border-primary/40 group-[.toaster]:text-primary",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
