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
import { OfferVault, StatusOferta, PlataformaOrigem } from "@/hooks/queries/useOfferVault";

const PLATAFORMAS: { value: PlataformaOrigem; label: string; icon: string }[] = [
  { value: "tiktok", label: "TikTok", icon: "📱" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "👤" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "outro", label: "Outro", icon: "🔗" },
];

const STATUS_OPTIONS: { value: StatusOferta; label: string; icon: string }[] = [
  { value: "salva", label: "Salva", icon: "🟡" },
  { value: "em_teste", label: "Em Teste", icon: "🔵" },
  { value: "funcionou", label: "Funcionou", icon: "🟢" },
  { value: "nao_funcionou", label: "Não Funcionou", icon: "🔴" },
  { value: "lixo", label: "Lixo", icon: "⚫" },
];

const PAISES = [
  { value: "BR", label: "Brasil", flag: "🇧🇷" },
  { value: "US", label: "Estados Unidos", flag: "🇺🇸" },
  { value: "ES", label: "Espanha", flag: "🇪🇸" },
  { value: "MX", label: "México", flag: "🇲🇽" },
  { value: "PT", label: "Portugal", flag: "🇵🇹" },
  { value: "AR", label: "Argentina", flag: "🇦🇷" },
  { value: "CO", label: "Colômbia", flag: "🇨🇴" },
  { value: "CL", label: "Chile", flag: "🇨🇱" },
  { value: "PE", label: "Peru", flag: "🇵🇪" },
  { value: "UK", label: "Reino Unido", flag: "🇬🇧" },
  { value: "DE", label: "Alemanha", flag: "🇩🇪" },
  { value: "FR", label: "França", flag: "🇫🇷" },
  { value: "IT", label: "Itália", flag: "🇮🇹" },
];

const formSchema = z.object({
  titulo_curto: z.string().min(1, "Título obrigatório").max(100, "Máximo 100 caracteres"),
  origem_plataforma: z.string().min(1, "Plataforma obrigatória"),
  origem_url: z.string().url("URL inválida").optional().or(z.literal("")),
  pais: z.string().min(1, "País obrigatório"),
  status_oferta: z.string().min(1, "Status obrigatório"),
  como_testar: z.string().max(500, "Máximo 500 caracteres").optional(),
  aprendizado: z.string().max(1000, "Máximo 1000 caracteres").optional(),
}).refine((data) => {
  // como_testar é obrigatório se status = em_teste
  if (data.status_oferta === "em_teste" && (!data.como_testar || data.como_testar.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Campo obrigatório quando status é 'Em Teste'",
  path: ["como_testar"],
});

type FormData = z.infer<typeof formSchema>;

interface OfferFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer?: OfferVault | null;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export function OfferForm({ open, onOpenChange, offer, onSubmit, isLoading }: OfferFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo_curto: offer?.titulo_curto || "",
      origem_plataforma: offer?.origem_plataforma || "tiktok",
      origem_url: offer?.origem_url || "",
      pais: offer?.pais || "BR",
      status_oferta: offer?.status_oferta || "salva",
      como_testar: offer?.como_testar || "",
      aprendizado: offer?.aprendizado || "",
    },
  });

  const watchStatus = form.watch("status_oferta");

  const handleSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      origem_url: data.origem_url || undefined,
      como_testar: data.como_testar || undefined,
      aprendizado: data.aprendizado || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{offer ? "Editar Oferta" : "Nova Oferta"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo_curto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da oferta *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Suplemento termogênico viral" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origem_plataforma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plataforma *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLATAFORMAS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.icon} {p.label}
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
                name="pais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAISES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.flag} {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="origem_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link da oferta</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status_oferta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.icon} {s.label}
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
              name="como_testar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Como pretendo testar {watchStatus === "em_teste" && <span className="text-destructive">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Replicar criativo + adaptar CTA" 
                      className="resize-none h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="aprendizado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aprendizado</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Ex: Criativo bom, oferta fraca. Funciona só em X país." 
                      className="resize-none h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {offer ? "Salvar" : "Criar Oferta"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
