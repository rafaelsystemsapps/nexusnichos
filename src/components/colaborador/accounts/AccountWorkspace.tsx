import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Pencil, Trash2, Power, Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount, useDeleteAccount, useSetAccountStatus, statusFromDB, AccountStatus } from "@/hooks/queries";
import { PasswordField } from "@/components/shared/PasswordField";
import { AccountFormDialog, PAISES, PLATAFORMAS } from "./AccountFormDialog";
import { WeeklyOperationalTracker } from "./tracker/WeeklyOperationalTracker";

import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<string, string> = {
  ativa: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  desabilitada: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  banida: "bg-red-500/15 text-red-400 border-red-500/30",
};

interface Props {
  nichoId: string;
  accountId: string;
}

export function AccountWorkspace({ nichoId, accountId }: Props) {
  const { data: account, isLoading } = useAccount(accountId);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const navigate = useNavigate();
  const deleteMut = useDeleteAccount();
  const statusMut = useSetAccountStatus();

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;
  if (!account) return <div className="text-center py-12 text-muted-foreground">Conta não encontrada.</div>;

  const status = statusFromDB(account.status);
  const at = account.username ? `@${account.username}` : account.nome_conta;
  const plataformaLabel = PLATAFORMAS.find((p) => p.value === account.plataforma)?.label ?? account.plataforma;
  const paisLabel = PAISES.find((p) => p.value === account.pais)?.label ?? account.pais;

  const setStatus = async (s: AccountStatus) => {
    try {
      await statusMut.mutateAsync({ id: account.id, status: s });
      toast.success("Status atualizado");
    } catch (e: any) { toast.error(e.message); }
  };

  const copyAt = async () => {
    if (account.username) {
      await navigator.clipboard.writeText(`@${account.username}`);
      toast.success("Username copiado");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMut.mutateAsync({ id: account.id });
      toast.success("Conta removida");
      navigate(`/workspace/${nichoId}/contas`);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/workspace/${nichoId}/contas`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold truncate">{at}</h2>
              <span className={cn("text-[11px] px-2 py-0.5 rounded border", STATUS_STYLE[status])}>
                {status === "ativa" ? "Ativa" : status === "desabilitada" ? "Desabilitada" : "Banida"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{plataformaLabel} · {account.nome_conta}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {account.username && (
            <Button size="icon" variant="ghost" onClick={copyAt} title="Copiar @"><Copy className="h-4 w-4" /></Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => setEditOpen(true)} title="Editar"><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => setDeleteOpen(true)} title="Remover"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>

      {/* Info panel */}
      <div className="p-4 rounded-lg border border-border/40 bg-card/30 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Plataforma:</span> {plataformaLabel}</div>
        <div><span className="text-muted-foreground">País:</span> {paisLabel}</div>
        <div><span className="text-muted-foreground">Username:</span> {account.username ? `@${account.username}` : "—"}</div>
        <div>
          <span className="text-muted-foreground">Criada em:</span>{" "}
          {account.data_criacao_conta
            ? format(new Date(account.data_criacao_conta), "dd/MM/yyyy", { locale: ptBR })
            : "—"}
        </div>
        <div className="md:col-span-2">
          <div className="text-muted-foreground text-xs mb-1">Senha</div>
          <PasswordField value={account.senha_acesso} readOnly allowCopy />
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-2 pt-2 border-t border-border/30">
          <Button size="sm" variant={status === "ativa" ? "default" : "outline"} onClick={() => setStatus("ativa")}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Ativa
          </Button>
          <Button size="sm" variant={status === "desabilitada" ? "default" : "outline"} onClick={() => setStatus("desabilitada")}>
            <Power className="h-3.5 w-3.5 mr-1" /> Desabilitar
          </Button>
          <Button size="sm" variant={status === "banida" ? "default" : "outline"} onClick={() => setStatus("banida")}>
            <Ban className="h-3.5 w-3.5 mr-1" /> Banida
          </Button>
        </div>
      </div>

      {/* Tracker + Log */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          <WeeklyOperationalTracker accountId={accountId} nichoId={nichoId} />
        </div>
        <div className="xl:col-span-1">
          <AccountQuickLog accountId={accountId} nichoId={nichoId} />
        </div>
      </div>

      <AccountFormDialog open={editOpen} onOpenChange={setEditOpen} nichoId={nichoId} account={account} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove a conta e todo o histórico operacional (checklist e logs). Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
