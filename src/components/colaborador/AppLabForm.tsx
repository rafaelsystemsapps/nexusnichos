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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AppLabApp } from "./AppLabCard";

const formSchema = z.object({
  nome_app: z.string().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  descricao_curta: z.string().max(200, "Máximo 200 caracteres").optional(),
  status_teste: z.enum(["em_analise", "em_teste", "validado", "descartado"]),
  usuarios_ativos: z.coerce.number().min(0, "Deve ser positivo"),
  observacoes: z.string().max(500, "Máximo 500 caracteres").optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AppLabFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app?: AppLabApp | null;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  { value: "em_analise", label: "🟡 Em Análise" },
  { value: "em_teste", label: "🔵 Em Teste" },
  { value: "validado", label: "🟢 Validado" },
  { value: "descartado", label: "🔴 Descartado" },
];

export function AppLabForm({
  open,
  onOpenChange,
  app,
  onSubmit,
  isLoading,
}: AppLabFormProps) {
  const isEditing = !!app;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome_app: app?.nome_app || "",
      descricao_curta: app?.descricao_curta || "",
      status_teste: app?.status_teste || "em_analise",
      usuarios_ativos: app?.usuarios_ativos || 0,
      observacoes: app?.observacoes || "",
    },
  });

  const handleSubmit = async (data: FormData) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar App" : "Novo App"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do app"
              : "Cadastre um novo app no laboratório"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_app"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do App *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: CapCut, Canva, etc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao_curta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Curta</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Para que serve esse app?"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status_teste"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="usuarios_ativos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuários Ativos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas estratégicas sobre o app..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
