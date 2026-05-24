import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";

interface PasswordFieldProps {
  value: string | null | undefined;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  allowCopy?: boolean;
}

export function PasswordField({ value, onChange, readOnly, placeholder, allowCopy }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success("Senha copiada");
  };
  return (
    <div className="flex gap-1">
      <Input
        type={visible ? "text" : "password"}
        value={value ?? ""}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        autoComplete="new-password"
      />
      <Button type="button" variant="ghost" size="icon" onClick={() => setVisible((v) => !v)} title={visible ? "Ocultar" : "Mostrar"}>
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      {allowCopy && value && (
        <Button type="button" variant="ghost" size="icon" onClick={handleCopy} title="Copiar">
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
