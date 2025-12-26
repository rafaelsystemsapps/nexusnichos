import { useState, useMemo } from "react";
import { Plus, Gem, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  useOfferVault, 
  useCreateOffer, 
  useUpdateOffer, 
  useDeleteOffer,
  OfferVault,
  StatusOferta,
  STATUS_ORDER,
} from "@/hooks/queries/useOfferVault";
import { OfferCard } from "./OfferCard";
import { OfferForm } from "./OfferForm";

interface OfferVaultTabProps {
  nichoId: string;
}

const STATUS_CONFIG: Record<StatusOferta, { label: string; color: string }> = {
  salva: { label: "Salvas", color: "bg-amber-500" },
  em_teste: { label: "Em Teste", color: "bg-blue-500" },
  funcionou: { label: "Funcionou", color: "bg-emerald-500" },
  nao_funcionou: { label: "Não Funcionou", color: "bg-red-500" },
  lixo: { label: "Lixo", color: "bg-zinc-500" },
};

const PLATAFORMAS = [
  { value: "all", label: "Todas" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "outro", label: "Outro" },
];

const PAISES = [
  { value: "all", label: "Todos" },
  { value: "BR", label: "🇧🇷 Brasil" },
  { value: "US", label: "🇺🇸 EUA" },
  { value: "ES", label: "🇪🇸 Espanha" },
  { value: "MX", label: "🇲🇽 México" },
  { value: "PT", label: "🇵🇹 Portugal" },
];

const STATUS_FILTER = [
  { value: "all", label: "Todos" },
  { value: "salva", label: "🟡 Salvas" },
  { value: "em_teste", label: "🔵 Em Teste" },
  { value: "funcionou", label: "🟢 Funcionou" },
  { value: "nao_funcionou", label: "🔴 Não Funcionou" },
  { value: "lixo", label: "⚫ Lixo" },
];

const TESTADAS_FILTER = [
  { value: "all", label: "Todas" },
  { value: "testadas", label: "Testadas" },
  { value: "nao_testadas", label: "Não testadas" },
];

export function OfferVaultTab({ nichoId }: OfferVaultTabProps) {
  const { data: offers = [], isLoading } = useOfferVault(nichoId);
  const createOffer = useCreateOffer(nichoId);
  const updateOffer = useUpdateOffer(nichoId);
  const deleteOffer = useDeleteOffer(nichoId);

  const [formOpen, setFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferVault | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlataforma, setFilterPlataforma] = useState("all");
  const [filterPais, setFilterPais] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTestadas, setFilterTestadas] = useState("all");

  // Calculate stats
  const stats = useMemo(() => {
    const result: Record<StatusOferta, number> = {
      salva: 0,
      em_teste: 0,
      funcionou: 0,
      nao_funcionou: 0,
      lixo: 0,
    };
    offers.forEach((o) => {
      const s = o.status_oferta as StatusOferta;
      if (result[s] !== undefined) result[s]++;
    });
    return result;
  }, [offers]);

  // Filter and sort offers
  const filteredOffers = useMemo(() => {
    let result = [...offers];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.titulo_curto.toLowerCase().includes(q) ||
          o.como_testar?.toLowerCase().includes(q) ||
          o.aprendizado?.toLowerCase().includes(q)
      );
    }

    // Plataforma filter
    if (filterPlataforma !== "all") {
      result = result.filter((o) => o.origem_plataforma === filterPlataforma);
    }

    // País filter
    if (filterPais !== "all") {
      result = result.filter((o) => o.pais === filterPais);
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((o) => o.status_oferta === filterStatus);
    }

    // Testadas filter
    if (filterTestadas !== "all") {
      const testadasStatus: StatusOferta[] = ["em_teste", "funcionou", "nao_funcionou"];
      if (filterTestadas === "testadas") {
        result = result.filter((o) => testadasStatus.includes(o.status_oferta as StatusOferta));
      } else {
        result = result.filter((o) => !testadasStatus.includes(o.status_oferta as StatusOferta));
      }
    }

    // Sort by status order (em_teste first, lixo last)
    result.sort((a, b) => {
      const aIndex = STATUS_ORDER.indexOf(a.status_oferta as StatusOferta);
      const bIndex = STATUS_ORDER.indexOf(b.status_oferta as StatusOferta);
      if (aIndex !== bIndex) return aIndex - bIndex;
      // Same status: sort by updated_at desc
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return result;
  }, [offers, searchQuery, filterPlataforma, filterPais, filterStatus, filterTestadas]);

  const handleCreate = () => {
    setEditingOffer(null);
    setFormOpen(true);
  };

  const handleEdit = (offer: OfferVault) => {
    setEditingOffer(offer);
    setFormOpen(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingOffer) {
        await updateOffer.mutateAsync({ id: editingOffer.id, ...data });
        toast.success("Oferta atualizada!");
      } else {
        await createOffer.mutateAsync(data);
        toast.success("Oferta criada!");
      }
      setFormOpen(false);
      setEditingOffer(null);
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOffer.mutateAsync(id);
      toast.success("Oferta excluída!");
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  const handleStatusChange = async (id: string, status: StatusOferta) => {
    try {
      await updateOffer.mutateAsync({ id, status_oferta: status });
      toast.success(`Status: ${STATUS_CONFIG[status].label}`);
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
        <div className="h-32 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Gem className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">OfferVault</h2>
            <p className="text-sm text-muted-foreground">
              Cofre de ofertas • Memória estratégica
            </p>
          </div>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Oferta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <Card className="bg-surface/50 border-border/30">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold">{offers.length}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        {(Object.keys(STATUS_CONFIG) as StatusOferta[]).map((s) => (
          <Card key={s} className="bg-surface/50 border-border/30">
            <CardContent className="p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[s].color}`} />
                <span className="text-2xl font-bold">{stats[s]}</span>
              </div>
              <div className="text-xs text-muted-foreground">{STATUS_CONFIG[s].label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ofertas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterPlataforma} onValueChange={setFilterPlataforma}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Plataforma" />
          </SelectTrigger>
          <SelectContent>
            {PLATAFORMAS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPais} onValueChange={setFilterPais}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            {PAISES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTestadas} onValueChange={setFilterTestadas}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Testadas" />
          </SelectTrigger>
          <SelectContent>
            {TESTADAS_FILTER.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Offers grid */}
      {filteredOffers.length === 0 ? (
        <Card className="bg-surface/50 border-dashed">
          <CardContent className="py-12 text-center">
            <Gem className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">Nenhuma oferta encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {offers.length === 0
                ? "Comece adicionando sua primeira oferta"
                : "Tente ajustar os filtros"}
            </p>
            {offers.length === 0 && (
              <Button onClick={handleCreate} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Oferta
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      <OfferForm
        open={formOpen}
        onOpenChange={setFormOpen}
        offer={editingOffer}
        onSubmit={handleSubmit}
        isLoading={createOffer.isPending || updateOffer.isPending}
      />
    </div>
  );
}
