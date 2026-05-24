import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PasswordField } from "@/components/shared/PasswordField";
import { useCreateAccount, useUpdateAccount, AccountStatus, AccountRow } from "@/hooks/queries";
import { toast } from "sonner";

export const PLATAFORMAS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter/X" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "site", label: "Site" },
];

export const PAISES = [
  { value: "BR", label: "🇧🇷 Brasil" },
  { value: "US", label: "🇺🇸 EUA" },
  { value: "PT", label: "🇵🇹 Portugal" },
  { value: "ES", label: "🇪🇸 Espanha" },
  { value: "MX", label: "🇲🇽 México" },
  { value: "AR", label: "🇦🇷 Argentina" },
  { value: "UK", label: "🇬🇧 Reino Unido" },
  { value: "outro", label: "🌍 Outro" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  nichoId: string;
  account?: AccountRow | null;
}

export function AccountFormDialog({ open, onOpenChange, nichoId, account }: Props) {
  const isEdit = !!account;
  const createMut = useCreateAccount();
  const updateMut = useUpdateAccount();

  const [form, setForm] = useState({
    nome_conta: account?.nome_conta ?? "",
    username: account?.username ?? "",
    plataforma: account?.plataforma ?? "instagram",
    senha_acesso: account?.senha_acesso ?? "",
    pais: account?.pais ?? "BR",
    data_criacao_conta: account?.data_criacao_conta ?? "",
    status: ((): AccountStatus => {
      if (account?.status === "banida") return "banida";
      if (account?.status === "pausada" || account?.status === "limitada") return "desabilitada";
      return "ativa";
    })(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_conta.trim()) {
      toast.error("Nome da conta é obrigatório");
      return;
    }
    try {
      if (isEdit && account) {
        await updateMut.mutateAsync({ id: account.id, nicho_id: nichoId, ...form });
        toast.success("Conta atualizada");
      } else {
        await createMut.mutateAsync({ nicho_id: nichoId, ...form });
        toast.success("Conta criada");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Conta" : "Nova Conta"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nome da conta</Label>
            <Input value={form.nome_conta} onChange={(e) => setForm({ ...form, nome_conta: e.target.value })} placeholder="Ex: Ampulheta Fit" />
          </div>
          <div>
            <Label>Username (@)</Label>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.replace(/^@/, "") })} placeholder="ampulhetafit" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Plataforma</Label>
              <Select value={form.plataforma} onValueChange={(v) => setForm({ ...form, plataforma: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATAFORMAS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>País</Label>
              <Select value={form.pais} onValueChange={(v) => setForm({ ...form, pais: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAISES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Senha</Label>
            <PasswordField value={form.senha_acesso} onChange={(v) => setForm({ ...form, senha_acesso: v })} placeholder="••••••" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Data de criação</Label>
              <Input type="date" value={form.data_criacao_conta ?? ""} onChange={(e) => setForm({ ...form, data_criacao_conta: e.target.value })} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AccountStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="desabilitada">Desabilitada</SelectItem>
                  <SelectItem value="banida">Banida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
