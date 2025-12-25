import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AvatarEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  currentEmoji?: string | null;
  currentColor?: string | null;
  onSave: () => void;
}

// Paleta de cores estilo Telegram
const AVATAR_COLORS = [
  "#FF5733", // Vermelho
  "#FF8C00", // Laranja
  "#FFD700", // Amarelo
  "#32CD32", // Verde
  "#00CED1", // Ciano
  "#3B82F6", // Azul
  "#8B5CF6", // Roxo
  "#EC4899", // Rosa
  "#6B7280", // Cinza
  "#92400E", // Marrom
  "#F97316", // Laranja claro
  "#14B8A6", // Teal
];

// Categorias de emojis
const EMOJI_CATEGORIES = {
  "Rostos": ["😀", "😎", "🤓", "😊", "🥳", "😇", "🤩", "😜", "🧐", "🤠", "🥸", "😈"],
  "Animais": ["🐱", "🐶", "🦁", "🐼", "🦊", "🐸", "🐵", "🦄", "🐧", "🐳", "🦋", "🐰"],
  "Objetos": ["🚀", "💼", "🎯", "🔥", "⭐", "💡", "🎨", "🎮", "📱", "💻", "🎧", "📸"],
  "Natureza": ["🌸", "🌺", "🌻", "🍀", "🌙", "☀️", "🌈", "❄️", "🌊", "⚡", "🔮", "💎"],
  "Esportes": ["⚽", "🏀", "🎾", "🏈", "⚾", "🎱", "🏓", "🥊", "🏋️", "🚴", "🏊", "⛷️"],
  "Comida": ["🍕", "🍔", "🌮", "🍣", "🍜", "🍦", "🎂", "☕", "🍺", "🍷", "🧁", "🍩"],
};

export function AvatarEditor({
  open,
  onOpenChange,
  userId,
  userName,
  currentEmoji,
  currentColor,
  onSave,
}: AvatarEditorProps) {
  const [selectedEmoji, setSelectedEmoji] = useState<string>(currentEmoji || "😀");
  const [selectedColor, setSelectedColor] = useState<string>(currentColor || AVATAR_COLORS[5]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("Rostos");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_emoji: selectedEmoji,
          avatar_color: selectedColor,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Avatar atualizado com sucesso!");
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar avatar:", error);
      toast.error("Erro ao salvar avatar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_emoji: null,
          avatar_color: null,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Avatar removido!");
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao remover avatar:", error);
      toast.error("Erro ao remover avatar");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Personalizar Avatar</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl shadow-lg transition-all duration-300"
              style={{ backgroundColor: selectedColor }}
            >
              {selectedEmoji || (
                <span className="text-white font-bold text-3xl">
                  {getInitials(userName)}
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{userName}</span>
          </div>

          {/* Seletor de Cores */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Escolha uma cor</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "w-10 h-10 rounded-lg transition-all duration-200 hover:scale-110",
                    selectedColor === color && "ring-2 ring-offset-2 ring-primary"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Categorias de Emoji */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Escolha um emoji</label>
            <div className="flex flex-wrap gap-1 mb-3">
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category)}
                  className="text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1">
              {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-muted",
                    selectedEmoji === emoji && "ring-2 ring-primary bg-muted"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isSaving}
              className="flex-1"
            >
              Remover
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
