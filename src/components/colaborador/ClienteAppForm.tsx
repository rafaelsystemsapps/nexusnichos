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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateClienteApp, useUpdateClienteApp, ClienteApp } from "@/hooks/queries/useClienteApps";

const formSchema = z.object({
  nome_app: z.string().min(1, "Nome obrigatório").max(100),
  tipo_custo: z.enum(["recorrente", "estrutura"]),
  valor: z.coerce.number().min(0, "Valor inválido"),
  periodicidade: z.enum(["mensal", "anual", "unico"]),
  rateio: z.enum(["exclusivo", "compartilhado"]),
  mapa_mental_url: z.string().url("URL inválida").optional().or(z.literal("")),
  observacao: z.string().max(200).optional(),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface ClienteAppFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string;
  nichoId: string;
  app?: ClienteApp | null;
}

export function ClienteAppForm({
  open,
  onOpenChange,
  clienteId,
  nichoId,
  app,
}: ClienteAppFormProps) {
  const createApp = useCreateClienteApp();
  const updateApp = useUpdateClienteApp();
  const isEditing = !!app;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_app: app?.nome_app || "",
      tipo_custo: app?.tipo_custo || "recorrente",
      valor: app?.valor || 0,
      periodicidade: app?.periodicidade || "mensal",
      rateio: app?.rateio || "exclusivo",
      mapa_mental_url: app?.mapa_mental_url || "",
      observacao: app?.observacao || "",
      ativo: app?.ativo ?? true,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (isEditing && app) {
      await updateApp.mutateAsync({
        id: app.id,
        ...data,
        mapa_mental_url: data.mapa_mental_url || null,
        observacao: data.observacao || null,
      });
    } else {
      await createApp.mutateAsync({
        cliente_id: clienteId,
        nicho_id: nichoId,
        nome_app: data.nome_app,
        tipo_custo: data.tipo_custo,
        valor: data.valor,
        periodicidade: data.periodicidade,
        rateio: data.rateio,
        mapa_mental_url: data.mapa_mental_url || null,
        observacao: data.observacao || null,
        ativo: data.ativo,
      });
    }
    onOpenChange(false);
    form.reset();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset({
        nome_app: "",
        tipo_custo: "recorrente",
        valor: 0,
        periodicidade: "mensal",
        rateio: "exclusivo",
        mapa_mental_url: "",
        observacao: "",
        ativo: true,
      });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar App" : "Adicionar App"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_app"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do App/Serviço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Lovable Pro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_custo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Custo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="recorrente">🔁 Recorrente</SelectItem>
                        <SelectItem value="estrutura">🧱 Estrutura</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="rateio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rateio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="exclusivo">Exclusivo</SelectItem>
                        <SelectItem value="compartilhado">Compartilhado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="mapa_mental_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mapa Mental URL (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://tldraw.com/..."
                      {...field}
                    />
                  </FormControl>
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
                      placeholder="Ex: Pago em dólar, vai subir mês que vem..."
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
                  <div>
                    <FormLabel className="cursor-pointer">Ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Apps inativos não contam no custo mensal
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
