import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateFerramentaTrabalho,
  useUpdateFerramentaTrabalho,
  FerramentaTrabalho,
} from "@/hooks/queries/useFerramentasTrabalho";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  valor: z.coerce.number().min(0, "Valor deve ser positivo"),
  periodicidade: z.enum(["mensal", "anual"]),
  categoria: z.string().optional(),
  ativo: z.boolean(),
  observacao: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface FerramentaTrabalhoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nichoId: string;
  ferramenta?: FerramentaTrabalho | null;
}

const CATEGORIAS = [
  { value: "design", label: "Design" },
  { value: "ia", label: "IA" },
  { value: "infra", label: "Infraestrutura" },
  { value: "marketing", label: "Marketing" },
  { value: "produtividade", label: "Produtividade" },
  { value: "outros", label: "Outros" },
];

export function FerramentaTrabalhoForm({
  open,
  onOpenChange,
  nichoId,
  ferramenta,
}: FerramentaTrabalhoFormProps) {
  const createMutation = useCreateFerramentaTrabalho();
  const updateMutation = useUpdateFerramentaTrabalho();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      valor: 0,
      periodicidade: "mensal",
      categoria: "outros",
      ativo: true,
      observacao: "",
    },
  });

  useEffect(() => {
    if (ferramenta) {
      form.reset({
        nome: ferramenta.nome,
        valor: ferramenta.valor,
        periodicidade: ferramenta.periodicidade as "mensal" | "anual",
        categoria: ferramenta.categoria || "outros",
        ativo: ferramenta.ativo,
        observacao: ferramenta.observacao || "",
      });
    } else {
      form.reset({
        nome: "",
        valor: 0,
        periodicidade: "mensal",
        categoria: "outros",
        ativo: true,
        observacao: "",
      });
    }
  }, [ferramenta, form, open]);

  const onSubmit = async (data: FormData) => {
    if (ferramenta) {
      await updateMutation.mutateAsync({
        id: ferramenta.id,
        nichoId,
        nome: data.nome,
        valor: data.valor,
        periodicidade: data.periodicidade,
        categoria: data.categoria || "outros",
        ativo: data.ativo,
        observacao: data.observacao || null,
      });
    } else {
      await createMutation.mutateAsync({
        nicho_id: nichoId,
        nome: data.nome,
        valor: data.valor,
        periodicidade: data.periodicidade,
        categoria: data.categoria || "outros",
        ativo: data.ativo,
        observacao: data.observacao || null,
      });
    }

    onOpenChange(false);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {ferramenta ? "Editar Ferramenta" : "Nova Ferramenta"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Figma Pro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="periodicidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periodicidade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anotações sobre esta ferramenta..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Ferramentas inativas não contam no custo total
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
