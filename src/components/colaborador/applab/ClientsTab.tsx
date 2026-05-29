import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AppLabClient,
  useAppLabClients,
  useCreateAppLabClient,
  useDeleteAppLabClient,
  useUpdateAppLabClient,
} from "@/hooks/queries/useAppLabClients";
import {
  AppFormInput,
  AppLabApp,
  useCreateAppLabApp,
} from "@/hooks/queries/useAppLabApps";
import {
  AppLabFilters,
  BillingFilter,
  StatusFilter,
  TypeFilter,
} from "./AppLabFilters";
import { ClientCard } from "./ClientCard";
import { ClientFormDialog } from "./ClientFormDialog";
import { ClientDetailDialog } from "./ClientDetailDialog";
import { computeBillingStatus } from "@/lib/applab-billing";

interface Props {
  nichoId: string;
  apps: AppLabApp[];
}

export function ClientsTab({ nichoId, apps }: Props) {
  const { data: clients = [], isLoading } = useAppLabClients(nichoId);
  const createMut = useCreateAppLabClient(nichoId);
  const updateMut = useUpdateAppLabClient(nichoId);
  const deleteMut = useDeleteAppLabClient(nichoId);
  const createAppMut = useCreateAppLabApp(nichoId);

  const appName = (id: string | null) => apps.find((a) => a.id === id)?.name ?? null;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppLabClient | null>(null);
  const [detail, setDetail] = useState<AppLabClient | null>(null);
  const [toDelete, setToDelete] = useState<AppLabClient | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter((c) => {
      if (q) {
        const inName = c.name.toLowerCase().includes(q);
        const inApp = (appName(c.app_id) ?? "").toLowerCase().includes(q);
        if (!inName && !inApp) return false;
      }
      if (typeFilter !== "all" && c.app_type !== typeFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (billingFilter !== "all") {
        if (c.app_type !== "b2b") return false;
        if (computeBillingStatus(c.billing) !== billingFilter) return false;
      }
      return true;
    });
  }, [clients, apps, search, typeFilter, statusFilter, billingFilter]);

  const handleSubmit = async (input: any) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, input });
    } else {
      await createMut.mutateAsync(input);
    }
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Pastas de clientes vinculados a apps</p>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Cliente
        </Button>
      </div>

      <AppLabFilters
        search={search}
        onSearch={setSearch}
        typeFilter={typeFilter}
        onType={setTypeFilter}
        statusFilter={statusFilter}
        onStatus={setStatusFilter}
        billingFilter={billingFilter}
        onBilling={setBillingFilter}
        showBilling={clients.some((c) => c.app_type === "b2b")}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {clients.length === 0 ? "Nenhum cliente cadastrado ainda" : "Nenhum resultado com esses filtros"}
          </p>
          {clients.length === 0 && (
            <Button variant="outline" className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar primeiro
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((c) => (
            <ClientCard key={c.id} client={c} appName={appName(c.app_id)} onClick={setDetail} />
          ))}
        </div>
      )}

      <ClientFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        client={editing}
        apps={apps}
        onSubmit={handleSubmit}
        onCreateApp={(input: AppFormInput) => createAppMut.mutateAsync(input)}
        isLoading={createMut.isPending || updateMut.isPending}
      />

      <ClientDetailDialog
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        client={detail}
        appName={detail ? appName(detail.app_id) : null}
        onEdit={(c) => {
          setDetail(null);
          setEditing(c);
          setFormOpen(true);
        }}
        onDelete={(c) => {
          setDetail(null);
          setToDelete(c);
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá "{toDelete?.name}" e seus dados de assinatura. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (toDelete) await deleteMut.mutateAsync(toDelete.id);
                setToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
