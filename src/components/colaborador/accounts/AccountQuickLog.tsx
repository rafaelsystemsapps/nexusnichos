import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateAccountLog } from "@/hooks/queries";
import { toast } from "sonner";

const ACTION_TYPES = [
  { value: "video_postado", label: "Vídeo postado" },
  { value: "stories", label: "Stories publicados" },
  { value: "login", label: "Login feito" },
  { value: "bio", label: "Bio alterada" },
  { value: "campanha", label: "Campanha ativada" },
  { value: "anuncio", label: "Anúncio revisado" },
  { value: "dm", label: "DMs respondidas" },
  { value: "outro", label: "Outro" },
];

interface Props {
  accountId: string;
  nichoId: string;
}

export function AccountQuickLog({ accountId, nichoId }: Props) {
  const [open, setOpen] = useState(false);
  const [actionType, setActionType] = useState("video_postado");
  const [description, setDescription] = useState("");
  const createMut = useCreateAccountLog();

  const handleSave = async () => {
    try {
      await createMut.mutateAsync({ account_id: accountId, nicho_id: nichoId, action_type: actionType, description });
      toast.success("Atividade registrada");
      setDescription("");
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao registrar");
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Registrar atividade
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar atividade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição (opcional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: vídeo sobre tema X" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={createMut.isPending}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { ACTION_TYPES };
