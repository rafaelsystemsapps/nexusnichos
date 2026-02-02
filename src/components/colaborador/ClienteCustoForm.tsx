import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Globe, CreditCard, Key, Package } from "lucide-react";
import { useCreateClienteApp, useUpdateClienteApp, ClienteApp, CategoriaClienteApp } from "@/hooks/queries/useClienteApps";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  nome_app: z.string().min(1, "Nome obrigatório").max(100),
  categoria: z.enum(["dominio", "assinatura", "licenca", "outro"]),
  valor: z.coerce.number().min(0, "Valor inválido"),
  periodicidade: z.enum(["mensal", "anual", "unico"]),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

const CATEGORIA_CONFIG: Record<CategoriaClienteApp, { label: string; icon: typeof Globe; colorClass: string; placeholder: string }> = {
  dominio: { label: "Domínio", icon: Globe, colorClass: "text-cyan-400", placeholder: "Ex: doguetto.com.br" },
  assinatura: { label: "Assinatura", icon: CreditCard, colorClass: "text-purple-400", placeholder: "Ex: Hotmart PRO" },
  licenca: { label: "Licença", icon: Key, colorClass: "text-amber-400", placeholder: "Ex: Adobe Creative Cloud" },
  outro: { label: "Outro", icon: Package, colorClass: "text-muted-foreground", placeholder: "Ex: Custo adicional" },
};

interface ClienteCustoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  nichoId: string;
  app?: ClienteApp | null;
  defaultCategoria?: CategoriaClienteApp;
}

export function ClienteCustoForm({
  open,
  onOpenChange,
  clienteId,
  nichoId,
  app,
  defaultCategoria = "dominio",
}: ClienteCustoFormProps) {
  const createApp = useCreateClienteApp();
  const updateApp = useUpdateClienteApp();
  const isEditing = !!app;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_app: app?.nome_app || "",
      categoria: app?.categoria || defaultCategoria,
      valor: app?.valor || 0,
      periodicidade: app?.periodicidade || "mensal",
      ativo: app?.ativo ?? true,
    },
  });

  // Reset form when app or defaultCategoria changes
  useEffect(() => {
    if (open) {
      form.reset({
        nome_app: app?.nome_app || "",
        categoria: app?.categoria || defaultCategoria,
        valor: app?.valor || 0,
        periodicidade: app?.periodicidade || "mensal",
        ativo: app?.ativo ?? true,
      });
    }
  }, [open, app, defaultCategoria, form]);

  const watchCategoria = form.watch("categoria") as CategoriaClienteApp;
  const categoriaConfig = CATEGORIA_CONFIG[watchCategoria];

  const onSubmit = async (data: FormData) => {
    if (isEditing && app) {
      await updateApp.mutateAsync({
        id: app.id,
        nome_app: data.nome_app,
        categoria: data.categoria as CategoriaClienteApp,
        valor: data.valor,
        periodicidade: data.periodicidade,
        ativo: data.ativo,
      });
    } else {
      await createApp.mutateAsync({
        cliente_id: clienteId,
        nicho_id: nichoId,
        nome_app: data.nome_app,
        categoria: data.categoria as CategoriaClienteApp,
        tipo_custo: "recorrente",
        valor: data.valor,
        periodicidade: data.periodicidade,
        rateio: "exclusivo",
        mapa_mental_url: null,
        observacao: null,
        ativo: data.ativo,
      });
    }
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset({
        nome_app: "",
        categoria: defaultCategoria,
        valor: 0,
        periodicidade: "mensal",
        ativo: true,
      });
    }
    onOpenChange(open);
  };

  const getCategoriaLabel = () => {
    return CATEGORIA_CONFIG[watchCategoria]?.label || "Custo";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar ${getCategoriaLabel()}` : `Adicionar ${getCategoriaLabel()}`}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Seletor de Categoria */}
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Custo</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                    {(["dominio", "assinatura", "licenca", "outro"] as CategoriaClienteApp[]).map((cat) => {
                      const config = CATEGORIA_CONFIG[cat];
                      const Icon = config.icon;
                      const isSelected = field.value === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => field.onChange(cat)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all",
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border/50 hover:border-border"
                          )}
                        >
                          <Icon className={cn("h-4 w-4", config.colorClass)} />
                          <span className="text-xs">{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nome_app"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder={categoriaConfig.placeholder} {...field} />
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
                      <Input type="number" step="0.01" min="0" {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="unico">Único</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="cursor-pointer">Ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Custos inativos não contam no total
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createApp.isPending || updateApp.isPending}>
                {isEditing ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
