import { Toaster as Sonner, toast } from "sonner";
import { useIsIOSMobile } from "@/hooks/use-mobile";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const isIOSMobile = useIsIOSMobile();

  return (
    <Sonner
      theme="dark"
      position={isIOSMobile ? "bottom-center" : "top-center"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: isIOSMobile
            ? "group toast ios-glass ios-animate-slide-up rounded-[16px] shadow-lg border-border/20 mx-4 mb-20"
            : "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
        style: isIOSMobile ? {
          padding: "14px 16px",
          fontSize: "14px",
          fontWeight: 500,
        } : undefined,
        duration: isIOSMobile ? 3000 : 4000,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
