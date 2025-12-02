import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ConteudoFormProps {
  nichoId: string;
  conteudo?: any;
  initialDate?: Date;
  onSuccess: () => void;
}

export function ConteudoForm({ nichoId, conteudo, initialDate, onSuccess }: ConteudoFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    data_postagem: "",
    canal: "instagram",
    tipo_midia: "imagem",
    status: "planejado",
  });

  useEffect(() => {
    if (conteudo) {
      setFormData({
        titulo: conteudo.titulo,
        descricao: conteudo.descricao || "",
        data_postagem: conteudo.data_postagem,
        canal: conteudo.canal,
        tipo_midia: conteudo.tipo_midia,
        status: conteudo.status,
      });
    } else if (initialDate) {
      setFormData((prev) => ({
        ...prev,
        data_postagem: initialDate.toISOString().split("T")[0],
      }));
    }
  }, [conteudo, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data_postagem: formData.data_postagem,
        canal: formData.canal as any,
        tipo_midia: formData.tipo_midia as any,
        status: formData.status as any,
        nicho_id: nichoId,
        responsavel_id: user?.id || null,
      };

      if (conteudo) {
        const { error } = await supabase
          .from("conteudos")
          .update(payload)
          .eq("id", conteudo.id);

        if (error) throw error;
        toast.success("Conteúdo atualizado!");
      } else {
        const { error } = await supabase.from("conteudos").insert([payload]);

        if (error) throw error;
        toast.success("Conteúdo criado!");
      }

      onSuccess();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Título *</Label>
        <Input
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          required
        />
      </div>

      <div>
        <Label>Descrição</Label>
        <Textarea
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Data de Postagem *</Label>
          <Input
            type="date"
            value={formData.data_postagem}
            onChange={(e) => setFormData({ ...formData, data_postagem: e.target.value })}
            required
          />
        </div>

        <div>
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planejado">Planejado</SelectItem>
              <SelectItem value="em_producao">Em Produção</SelectItem>
              <SelectItem value="publicado">Publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Canal *</Label>
          <Select
            value={formData.canal}
            onValueChange={(value) => setFormData({ ...formData, canal: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tipo de Mídia *</Label>
          <Select
            value={formData.tipo_midia}
            onValueChange={(value) => setFormData({ ...formData, tipo_midia: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Vídeo</SelectItem>
              <SelectItem value="imagem">Imagem</SelectItem>
              <SelectItem value="carrossel">Carrossel</SelectItem>
              <SelectItem value="texto">Texto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {conteudo ? "Atualizar" : "Criar"}
      </Button>
    </form>
  );
}
