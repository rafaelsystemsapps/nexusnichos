import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NoRoleAssigned() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Conta Não Configurada</CardTitle>
          <CardDescription>
            Sua conta está aguardando configuração por um administrador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Um administrador precisa atribuir seu papel no sistema antes que você possa acessar o Nexus Nichos.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Entre em contato com o administrador do sistema para solicitar acesso.
          </p>
          <Button onClick={signOut} variant="outline" className="w-full">
            Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
