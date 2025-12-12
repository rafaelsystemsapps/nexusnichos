import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const transacaoSchema = z.object({
  produto_nome: z
    .string()
    .min(1, "Nome do produto é obrigatório")
    .max(255, "Nome muito longo"),
  preco_custo: z
    .string()
    .transform((val) => parseFloat(val.replace(",", ".")))
    .pipe(z.number().min(0, "Preço de custo deve ser >= 0")),
  preco_venda: z
    .string()
    .transform((val) => parseFloat(val.replace(",", ".")))
    .pipe(z.number().min(0, "Preço de venda deve ser >= 0")),
});

type TransacaoFormData = z.infer<typeof transacaoSchema>;

interface MembroTime {
  id: string;
  nome: string;
  funcao: string;
}

interface Produto {
  id: string;
  nome: string;
  preco_custo_padrao: number;
  preco_venda_padrao: number;
  ativa: boolean;
}

interface TransacaoFormProps {
  nichoId: string;
  onSuccess: () => void;
}

export function TransacaoForm({ nichoId, onSuccess }: TransacaoFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [membros, setMembros] = useState<MembroTime[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selectedMembro, setSelectedMembro] = useState<string>("");
  const [selectedProduto, setSelectedProduto] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransacaoFormData>({
    resolver: zodResolver(transacaoSchema),
  });

  useEffect(() => {
    if (open) {
      fetchMembros();
      fetchProdutos();
    }
  }, [open, nichoId]);

  const fetchMembros = async () => {
    const { data, error } = await supabase
      .from("membros_time")
      .select("id, nome, funcao")
      .eq("nicho_id", nichoId)
      .order("nome");

    if (!error && data) {
      setMembros(data);
    }
  };

  const fetchProdutos = async () => {
    const { data, error } = await supabase
      .from("produtos")
      .select("id, nome, preco_custo_padrao, preco_venda_padrao, ativa")
      .eq("nicho_id", nichoId)
      .eq("ativa", true)
      .order("nome");

    if (!error && data) {
      setProdutos(data);
    }
  };

  const handleProdutoChange = (produtoId: string) => {
    setSelectedProduto(produtoId);
    
    if (produtoId && produtoId !== "manual") {
      const produto = produtos.find(p => p.id === produtoId);
      if (produto) {
        setValue("produto_nome", produto.nome);
        setValue("preco_custo", produto.preco_custo_padrao.toString() as any);
        setValue("preco_venda", produto.preco_venda_padrao.toString() as any);
      }
    } else {
      setValue("produto_nome", "");
      setValue("preco_custo", "" as any);
      setValue("preco_venda", "" as any);
    }
  };

  const onSubmit = async (data: TransacaoFormData) => {
    if (!user) {
      toast.error("Você precisa estar logado");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("transacoes_financeiras").insert({
        nicho_id: nichoId,
        user_id: user.id,
        produto_nome: data.produto_nome,
        preco_custo: data.preco_custo,
        preco_venda: data.preco_venda,
        membro_time_id: selectedMembro && selectedMembro !== "none" ? selectedMembro : null,
        data_transacao: format(selectedDate, "yyyy-MM-dd"),
      });

      if (error) throw error;

      toast.success("Transação registrada!");
      reset();
      setSelectedMembro("");
      setSelectedProduto("");
      setSelectedDate(new Date());
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao registrar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Transação
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Seleção de Produto Cadastrado */}
          {produtos.length > 0 && (
            <div>
              <Label>Produto Cadastrado</Label>
              <Select value={selectedProduto} onValueChange={handleProdutoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione ou digite manualmente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Digitar manualmente</SelectItem>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="produto_nome">Nome do Produto/Serviço *</Label>
            <Input
              id="produto_nome"
              placeholder="Ex: Curso de Marketing Digital"
              {...register("produto_nome")}
            />
            {errors.produto_nome && (
              <p className="text-sm text-destructive mt-1">
                {errors.produto_nome.message}
              </p>
            )}
          </div>

          <div>
            <Label>Data da Venda *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="membro_responsavel">Responsável pela Venda</Label>
            <Select value={selectedMembro} onValueChange={setSelectedMembro}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (venda automática)</SelectItem>
                {membros.map((membro) => (
                  <SelectItem key={membro.id} value={membro.id}>
                    {membro.nome} - {membro.funcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="preco_custo">Preço de Custo (R$) *</Label>
            <Input
              id="preco_custo"
              type="text"
              placeholder="0,00"
              {...register("preco_custo")}
            />
            {errors.preco_custo && (
              <p className="text-sm text-destructive mt-1">
                {errors.preco_custo.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="preco_venda">Preço de Venda (R$) *</Label>
            <Input
              id="preco_venda"
              type="text"
              placeholder="0,00"
              {...register("preco_venda")}
            />
            {errors.preco_venda && (
              <p className="text-sm text-destructive mt-1">
                {errors.preco_venda.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Registrar Transação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
