import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NoNichoAssigned() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-warning" />
          </div>
          <CardTitle className="text-2xl">Nicho Não Atribuído</CardTitle>
          <CardDescription>
            Você ainda não foi atribuído a um nicho
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Um administrador precisa associar você a um workspace antes que você possa começar a trabalhar.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Entre em contato com o administrador do sistema para ser atribuído a um nicho.
          </p>
          <Button onClick={signOut} variant="outline" className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
