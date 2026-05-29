import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PAISES } from "@/lib/paises";
import { AppFormInput, AppLabApp } from "@/hooks/queries/useAppLabApps";

const schema = z.object({
  name: z.string().trim().min(1, "Obrigatório").max(120),
  app_type: z.enum(["b2b", "b2c"]),
  category: z.string().max(120).optional().nullable(),
  status: z.enum(["active", "inactive", "pending"]),
  country: z.string().max(8).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  created_at: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app?: AppLabApp | null;
  onSubmit: (input: AppFormInput) => Promise<void> | void;
  isLoading?: boolean;
}

export function AppFormDialog({ open, onOpenChange, app, onSubmit, isLoading }: Props) {
  const isEdit = !!app;
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      app_type: "b2b",
      category: "",
      status: "active",
      country: "BR",
      description: "",
      created_at: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: app?.name ?? "",
        app_type: (app?.app_type as any) ?? "b2b",
        category: app?.category ?? "",
        status: (app?.status as any) ?? "active",
        country: app?.country ?? "BR",
        description: app?.description ?? "",
        created_at: app?.created_at ? app.created_at.slice(0, 10) : "",
      });
    }
  }, [open, app]);

  const handle = async (data: FormData) => {
    await onSubmit({
      name: data.name,
      app_type: data.app_type,
      category: data.category || null,
      status: data.status,
      country: data.country || "BR",
      description: data.description || null,
      created_at: data.created_at ? new Date(data.created_at + "T00:00:00").toISOString() : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar app" : "Novo app"}</DialogTitle>
          <DialogDescription>Cadastre o app raiz do portfólio.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handle)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do app *</FormLabel>
                  <FormControl><Input {...field} placeholder="Ex: Ampulheta Fit" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="app_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="b2b" /> B2B
                      </Label>
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="b2c" /> B2C
                      </Label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="Ex: Fitness" /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="pending">Aguardando</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <Select value={field.value ?? "BR"} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {PAISES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="created_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de criação</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value ?? ""} placeholder="Opcional" />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
