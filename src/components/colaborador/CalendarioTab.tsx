import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ConteudoForm } from "./ConteudoForm";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarioTabProps {
  nichoId: string;
}

export function CalendarioTab({ nichoId }: CalendarioTabProps) {
  const [conteudos, setConteudos] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConteudo, setSelectedConteudo] = useState<any>(null);

  useEffect(() => {
    fetchConteudos();
  }, [nichoId]);

  const fetchConteudos = async () => {
    try {
      const { data, error } = await supabase
        .from("conteudos")
        .select("*, profiles:responsavel_id(nome)")
        .eq("nicho_id", nichoId)
        .order("data_postagem", { ascending: true });

      if (error) throw error;
      setConteudos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar conteúdos");
    }
  };

  const conteudosDodia = selectedDate
    ? conteudos.filter((c) => isSameDay(new Date(c.data_postagem), selectedDate))
    : [];

  const handleConteudoClick = (conteudo: any) => {
    setSelectedConteudo(conteudo);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedConteudo(null);
    fetchConteudos();
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      planejado: "secondary",
      em_producao: "default",
      publicado: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="border-border/50 shadow-premium">
        <CardHeader>
          <CardTitle className="text-xl">Calendário</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            className="rounded-md border-border/50"
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
          </h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedConteudo(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedConteudo ? "Editar Conteúdo" : "Novo Conteúdo"}
                </DialogTitle>
              </DialogHeader>
              <ConteudoForm
                nichoId={nichoId}
                conteudo={selectedConteudo}
                initialDate={selectedDate}
                onSuccess={handleDialogClose}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {conteudosDodia.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum conteúdo nesta data.</p>
          ) : (
            conteudosDodia.map((conteudo) => (
              <Card
                key={conteudo.id}
                className="cursor-pointer hover:bg-surface-hover transition-all duration-200 border-border/50 shadow-premium hover:shadow-premium-lg hover:border-primary/30"
                onClick={() => handleConteudoClick(conteudo)}
              >
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-base">{conteudo.titulo}</h4>
                    {getStatusBadge(conteudo.status)}
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">
                    {conteudo.canal} • {conteudo.tipo_midia}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
