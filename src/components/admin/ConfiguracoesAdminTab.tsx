import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Check, ChevronDown, Copy, Monitor, Apple, Terminal, Rocket, Info, RefreshCw, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useServiceWorker } from "@/hooks/useServiceWorker";

type OS = "windows" | "mac" | "linux" | "unknown";

const detectOS = (): OS => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("win")) return "windows";
  if (userAgent.includes("mac")) return "mac";
  if (userAgent.includes("linux")) return "linux";
  return "unknown";
};

export function ConfiguracoesAdminTab() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([detectOS()]);
  const { isChecking, checkForUpdates } = useServiceWorker();

  const handleCheckUpdates = async () => {
    await checkForUpdates();
    toast.success("Verificação concluída. Atualizações são aplicadas automaticamente.");
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(id);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const currentOS = detectOS();

  const linuxDesktopEntry = `[Desktop Entry]
Type=Application
Name=Nexus Nichos
Exec=google-chrome --app=https://nexusnichos.lovable.app
Icon=nexus-nichos
Terminal=false
Categories=Office;`;

  const osInstructions = [
    {
      id: "windows",
      title: "Windows",
      icon: Monitor,
      current: currentOS === "windows",
      steps: [
        { text: "Pressione", highlight: "Win + R", suffix: "para abrir o Executar" },
        { 
          text: "Digite:", 
          highlight: "shell:startup", 
          copyable: true, 
          copyId: "win-startup",
          suffix: "e pressione Enter"
        },
        { text: "A pasta de inicialização automática será aberta" },
        { text: "Crie um atalho do Nexus Nichos nesta pasta:" },
        { text: "• Clique direito no ícone do app na barra de tarefas", indent: true },
        { text: "• Selecione \"Nexus Nichos\" → Clique direito → \"Enviar para\" → \"Área de Trabalho\"", indent: true },
        { text: "• Mova o atalho criado para a pasta startup", indent: true },
      ]
    },
    {
      id: "mac",
      title: "Mac",
      icon: Apple,
      current: currentOS === "mac",
      steps: [
        { text: "Abra", highlight: "Preferências do Sistema" },
        { text: "Vá em", highlight: "Geral → Itens de Início" },
        { text: "Na aba \"Abrir no Início\", clique no", highlight: "+" },
        { text: "Navegue até Aplicativos e selecione", highlight: "Nexus Nichos" },
        { text: "Ou: clique direito no ícone do app no Dock → Opções → Abrir no início de sessão", indent: true },
      ]
    },
    {
      id: "linux",
      title: "Linux",
      icon: Terminal,
      current: currentOS === "linux",
      steps: [
        { text: "Crie um arquivo .desktop em:", highlight: "~/.config/autostart/" },
        { 
          text: "Nome do arquivo:", 
          highlight: "nexus-nichos.desktop", 
          copyable: true, 
          copyId: "linux-filename"
        },
        { text: "Conteúdo do arquivo:" },
        { 
          code: linuxDesktopEntry,
          copyable: true,
          copyId: "linux-content"
        },
        { text: "Salve o arquivo e reinicie o computador" },
      ]
    },
  ];

  // Ordenar para mostrar o OS atual primeiro
  const sortedInstructions = [...osInstructions].sort((a, b) => {
    if (a.current) return -1;
    if (b.current) return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Seção de Atualizações */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Atualizações do App</CardTitle>
              <CardDescription>
                Verifique e instale atualizações do aplicativo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-emerald-500/10 border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Atualização automática ativa</p>
              <p className="text-sm text-muted-foreground">
                Novas versões são aplicadas automaticamente ao abrir o app.
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleCheckUpdates}
              disabled={isChecking}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Verificando..." : "Verificar Atualizações"}
            </Button>
          </div>

          {/* Dica */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              O app verifica atualizações automaticamente a cada hora enquanto estiver aberto.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Inicialização Automática */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Inicialização Automática</CardTitle>
              <CardDescription>
                Configure o app para abrir automaticamente quando o computador ligar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Aviso de instalação PWA */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Pré-requisito</p>
              <p className="text-muted-foreground">
                O app deve estar instalado como PWA primeiro.{" "}
                <Link to="/install" className="text-primary hover:underline">
                  Clique aqui para instalar
                </Link>
              </p>
            </div>
          </div>

          {/* Instruções por OS */}
          <div className="space-y-3">
            {sortedInstructions.map((os) => (
              <Collapsible
                key={os.id}
                open={openSections.includes(os.id)}
                onOpenChange={() => toggleSection(os.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto bg-muted/30 hover:bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <os.icon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{os.title}</span>
                      {os.current && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          Seu sistema
                        </span>
                      )}
                    </div>
                    <ChevronDown 
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        openSections.includes(os.id) ? "rotate-180" : ""
                      }`} 
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-3 space-y-3 border-x border-b border-border/50 rounded-b-lg bg-background/50">
                    {os.steps.map((step, index) => (
                      <div key={index} className={`${step.indent ? "ml-4" : ""}`}>
                        {step.code ? (
                          <div className="space-y-2">
                            <pre className="p-3 rounded-lg bg-muted/50 border border-border/50 text-xs overflow-x-auto">
                              <code className="text-muted-foreground">{step.code}</code>
                            </pre>
                            {step.copyable && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(step.code, step.copyId!)}
                                className="h-8 text-xs"
                              >
                                {copiedItem === step.copyId ? (
                                  <>
                                    <Check className="h-3 w-3 mr-1.5" />
                                    Copiado!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 mr-1.5" />
                                    Copiar conteúdo
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-medium shrink-0">
                              {step.indent ? "•" : index + 1}
                            </span>
                            <span className="text-muted-foreground">
                              {step.text}{" "}
                              {step.highlight && (
                                <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-medium">
                                  {step.highlight}
                                </code>
                              )}
                              {step.suffix && ` ${step.suffix}`}
                              {step.copyable && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(step.highlight!, step.copyId!)}
                                  className="h-6 px-2 ml-2"
                                >
                                  {copiedItem === step.copyId ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
