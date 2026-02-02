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
import { useCreateClienteApp, useUpdateClienteApp, ClienteApp } from "@/hooks/queries/useClienteApps";

const formSchema = z.object({
  nome_app: z.string().min(1, "Nome obrigatório").max(100),
  valor: z.coerce.number().min(0, "Valor inválido"),
  periodicidade: z.enum(["mensal", "anual", "unico"]),
  mapa_mental_url: z.string().url("URL inválida").optional().or(z.literal("")),
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
      valor: app?.valor || 0,
      periodicidade: app?.periodicidade || "anual",
      mapa_mental_url: app?.mapa_mental_url || "",
      ativo: app?.ativo ?? true,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (isEditing && app) {
      await updateApp.mutateAsync({
        id: app.id,
        nome_app: data.nome_app,
        valor: data.valor,
        periodicidade: data.periodicidade,
        mapa_mental_url: data.mapa_mental_url || null,
        ativo: data.ativo,
      });
    } else {
      await createApp.mutateAsync({
        cliente_id: clienteId,
        nicho_id: nichoId,
        nome_app: data.nome_app,
        tipo_custo: "recorrente", // Default value
        valor: data.valor,
        periodicidade: data.periodicidade,
        rateio: "exclusivo", // Default value
        mapa_mental_url: data.mapa_mental_url || null,
        observacao: null, // Default value
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
        valor: 0,
        periodicidade: "anual",
        mapa_mental_url: "",
        ativo: true,
      });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Domínio" : "Adicionar Domínio"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_app"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Domínio</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: doguetto.com.br" {...field} />
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
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="cursor-pointer">Ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Domínios inativos não contam no custo
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
