import { useEffect, useState } from "react";
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
import { PasswordField } from "@/components/shared/PasswordField";
import { PAISES } from "@/lib/paises";
import { AppLabClient, ClientFormInput } from "@/hooks/queries/useAppLabClients";
import { AppFormInput, AppLabApp } from "@/hooks/queries/useAppLabApps";

const schema = z.object({
  name: z.string().trim().min(1, "Obrigatório").max(120),
  app_type: z.enum(["b2b", "b2c"]),
  status: z.enum(["active", "inactive", "pending"]),
  country: z.string().max(8).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  login_email: z.string().max(200).optional().nullable(),
  password: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  monthly_value: z.coerce.number().min(0).optional().nullable(),
  due_date: z.string().optional().nullable(),
  next_payment: z.string().optional().nullable(),
  plan: z.string().max(120).optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: AppLabClient | null;
  apps: AppLabApp[];
  onSubmit: (input: ClientFormInput) => Promise<void> | void;
  onCreateApp: (input: AppFormInput) => Promise<AppLabApp>;
  isLoading?: boolean;
}

type LinkMode = "none" | "existing" | "new";

export function ClientFormDialog({ open, onOpenChange, client, apps, onSubmit, onCreateApp, isLoading }: Props) {
  const isEdit = !!client;
  const [linkMode, setLinkMode] = useState<LinkMode>("none");
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [newAppName, setNewAppName] = useState("");
  const [creatingApp, setCreatingApp] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      app_type: "b2b",
      status: "pending",
      country: "BR",
      description: "",
      login_email: "",
      password: "",
      notes: "",
      monthly_value: undefined,
      due_date: "",
      next_payment: "",
      plan: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: client?.name ?? "",
        app_type: (client?.app_type as any) ?? "b2b",
        status: (client?.status as any) ?? "pending",
        country: client?.country ?? "BR",
        description: client?.description ?? "",
        login_email: client?.login_email ?? "",
        password: client?.password ?? "",
        notes: client?.notes ?? "",
        monthly_value: client?.billing?.monthly_value ?? undefined,
        due_date: client?.billing?.due_date ?? "",
        next_payment: client?.billing?.next_payment ?? "",
        plan: client?.billing?.plan ?? "",
      });
      setLinkMode(client?.app_id ? "existing" : "none");
      setSelectedAppId(client?.app_id ?? "");
      setNewAppName("");
    }
  }, [open, client]);

  const appType = form.watch("app_type");

  const handle = async (data: FormData) => {
    let appId: string | null = null;
    if (linkMode === "existing") {
      appId = selectedAppId || null;
    } else if (linkMode === "new" && newAppName.trim()) {
      setCreatingApp(true);
      try {
        const created = await onCreateApp({
          name: newAppName.trim(),
          app_type: data.app_type,
          status: "active",
          country: data.country || "BR",
        });
        appId = created.id;
      } finally {
        setCreatingApp(false);
      }
    }

    await onSubmit({
      name: data.name,
      app_type: data.app_type,
      status: data.status,
      app_id: appId,
      country: data.country || "BR",
      description: data.description || null,
      login_email: data.login_email || null,
      password: data.password || null,
      notes: data.notes || null,
      billing:
        data.app_type === "b2b"
          ? {
              monthly_value: data.monthly_value ?? null,
              due_date: data.due_date || null,
              next_payment: data.next_payment || null,
              plan: data.plan || null,
            }
          : null,
    });
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cliente/app" : "Novo cliente/app"}</DialogTitle>
          <DialogDescription>
            Gerencie identidade, credenciais{appType === "b2b" ? " e cobrança" : ""}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handle)} className="space-y-5">
            {/* Identidade */}
            <section className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Identidade</h4>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl><Input {...field} placeholder="Ex: ACME Corp" /></FormControl>
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
                          <RadioGroupItem value="b2b" /> B2B (cliente SaaS)
                        </Label>
                        <Label className="flex items-center gap-2 cursor-pointer">
                          <RadioGroupItem value="b2c" /> B2C (produto/app)
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Aguardando</SelectItem>
                          <SelectItem value="active">Ativo</SelectItem>
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
            </section>

            {/* Credenciais */}
            <section className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Credenciais</h4>
              <FormField
                control={form.control}
                name="login_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login / Email</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="usuario@exemplo.com" /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <PasswordField value={field.value ?? ""} onChange={field.onChange} placeholder="••••••••" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} value={field.value ?? ""} placeholder="Notas internas" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </section>

            {/* Billing (B2B only) */}
            {appType === "b2b" && (
              <section className="space-y-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                <h4 className="text-xs uppercase tracking-wider text-blue-400">Assinatura (B2B)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="monthly_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor mensal (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plano</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ""} placeholder="Ex: Pro" /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vencimento atual</FormLabel>
                        <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="next_payment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Próximo pagamento</FormLabel>
                        <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </section>
            )}

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
