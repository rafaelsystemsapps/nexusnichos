export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      biblioteca_nicho: {
        Row: {
          categoria: string
          conteudo: string
          created_at: string
          id: string
          nicho_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria: string
          conteudo: string
          created_at?: string
          id?: string
          nicho_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          conteudo?: string
          created_at?: string
          id?: string
          nicho_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "biblioteca_nicho_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_redes_sociais: {
        Row: {
          created_at: string | null
          data_criacao_conta: string | null
          id: string
          media_videos: number | null
          nicho_id: string
          nome_conta: string
          observacoes: string | null
          plataforma: Database["public"]["Enums"]["plataforma_social"]
          responsavel_id: string | null
          status: Database["public"]["Enums"]["status_conta"] | null
          status_aquecimento: string | null
          tipo_conteudo: string | null
          updated_at: string | null
          url_conta: string | null
        }
        Insert: {
          created_at?: string | null
          data_criacao_conta?: string | null
          id?: string
          media_videos?: number | null
          nicho_id: string
          nome_conta: string
          observacoes?: string | null
          plataforma: Database["public"]["Enums"]["plataforma_social"]
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_conta"] | null
          status_aquecimento?: string | null
          tipo_conteudo?: string | null
          updated_at?: string | null
          url_conta?: string | null
        }
        Update: {
          created_at?: string | null
          data_criacao_conta?: string | null
          id?: string
          media_videos?: number | null
          nicho_id?: string
          nome_conta?: string
          observacoes?: string | null
          plataforma?: Database["public"]["Enums"]["plataforma_social"]
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_conta"] | null
          status_aquecimento?: string | null
          tipo_conteudo?: string | null
          updated_at?: string | null
          url_conta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_redes_sociais_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudo_bruto: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nicho_id: string
          responsavel_id: string | null
          tipo: string
          titulo: string | null
          updated_at: string
          url_arquivo: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nicho_id: string
          responsavel_id?: string | null
          tipo: string
          titulo?: string | null
          updated_at?: string
          url_arquivo?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nicho_id?: string
          responsavel_id?: string | null
          tipo?: string
          titulo?: string | null
          updated_at?: string
          url_arquivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conteudo_bruto_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      conteudos: {
        Row: {
          anexo_url: string | null
          canal: Database["public"]["Enums"]["plataforma_social"]
          created_at: string | null
          data_postagem: string
          descricao: string | null
          id: string
          nicho_id: string
          responsavel_id: string | null
          status: Database["public"]["Enums"]["status_conteudo"] | null
          tipo_midia: Database["public"]["Enums"]["tipo_midia"]
          titulo: string
          updated_at: string | null
        }
        Insert: {
          anexo_url?: string | null
          canal: Database["public"]["Enums"]["plataforma_social"]
          created_at?: string | null
          data_postagem: string
          descricao?: string | null
          id?: string
          nicho_id: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_conteudo"] | null
          tipo_midia: Database["public"]["Enums"]["tipo_midia"]
          titulo: string
          updated_at?: string | null
        }
        Update: {
          anexo_url?: string | null
          canal?: Database["public"]["Enums"]["plataforma_social"]
          created_at?: string | null
          data_postagem?: string
          descricao?: string | null
          id?: string
          nicho_id?: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_conteudo"] | null
          tipo_midia?: Database["public"]["Enums"]["tipo_midia"]
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conteudos_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      membros_time: {
        Row: {
          contato: string | null
          created_at: string | null
          especialidade: string | null
          funcao: string
          id: string
          nicho_id: string
          nome: string
          observacoes: string | null
          updated_at: string | null
        }
        Insert: {
          contato?: string | null
          created_at?: string | null
          especialidade?: string | null
          funcao: string
          id?: string
          nicho_id: string
          nome: string
          observacoes?: string | null
          updated_at?: string | null
        }
        Update: {
          contato?: string | null
          created_at?: string | null
          especialidade?: string | null
          funcao?: string
          id?: string
          nicho_id?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membros_time_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      nichos: {
        Row: {
          created_at: string | null
          descricao: string | null
          financeiro_habilitado: boolean
          id: string
          nome: string
          observacoes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          financeiro_habilitado?: boolean
          id?: string
          nome: string
          observacoes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          financeiro_habilitado?: boolean
          id?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          data_entrada: string | null
          email: string
          id: string
          nome: string
          observacoes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_entrada?: string | null
          email: string
          id: string
          nome: string
          observacoes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_entrada?: string | null
          email?: string
          id?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      semana_logistica: {
        Row: {
          ano: number
          created_at: string
          id: string
          nicho_id: string
          semana_fim: string
          semana_inicio: string
          semana_numero: number
          status: string
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          id?: string
          nicho_id: string
          semana_fim: string
          semana_inicio: string
          semana_numero: number
          status?: string
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          id?: string
          nicho_id?: string
          semana_fim?: string
          semana_inicio?: string
          semana_numero?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "semana_logistica_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      subtarefas_conteudo: {
        Row: {
          concluida: boolean
          conteudo_id: string
          created_at: string
          id: string
          observacoes: string | null
          responsavel_id: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          concluida?: boolean
          conteudo_id: string
          created_at?: string
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          concluida?: boolean
          conteudo_id?: string
          created_at?: string
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtarefas_conteudo_conteudo_id_fkey"
            columns: ["conteudo_id"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefa_diaria: {
        Row: {
          created_at: string
          data: string
          dia_semana: number
          id: string
          responsavel_id: string | null
          semana_id: string
          status: Database["public"]["Enums"]["status_tarefa"]
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          dia_semana: number
          id?: string
          responsavel_id?: string | null
          semana_id: string
          status?: Database["public"]["Enums"]["status_tarefa"]
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          dia_semana?: number
          id?: string
          responsavel_id?: string | null
          semana_id?: string
          status?: Database["public"]["Enums"]["status_tarefa"]
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_diaria_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_diaria_semana_id_fkey"
            columns: ["semana_id"]
            isOneToOne: false
            referencedRelation: "semana_logistica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_diaria_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "tarefa_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefa_templates: {
        Row: {
          ativa: boolean
          conta_id: string | null
          created_at: string
          descricao: string | null
          id: string
          nicho_id: string
          ordem: number
          titulo: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          conta_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nicho_id: string
          ordem?: number
          titulo: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          conta_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nicho_id?: string
          ordem?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefa_templates_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_redes_sociais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefa_templates_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      transacoes_financeiras: {
        Row: {
          created_at: string
          data_transacao: string
          id: string
          membro_time_id: string | null
          nicho_id: string
          preco_custo: number
          preco_venda: number
          produto_nome: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_transacao?: string
          id?: string
          membro_time_id?: string | null
          nicho_id: string
          preco_custo: number
          preco_venda: number
          produto_nome: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_transacao?: string
          id?: string
          membro_time_id?: string | null
          nicho_id?: string
          preco_custo?: number
          preco_venda?: number
          produto_nome?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacoes_financeiras_membro_time_id_fkey"
            columns: ["membro_time_id"]
            isOneToOne: false
            referencedRelation: "membros_time"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_nichos: {
        Row: {
          created_at: string | null
          id: string
          nicho_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nicho_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nicho_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_nichos_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_nicho: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "colaborador"
      plataforma_social:
        | "tiktok"
        | "instagram"
        | "youtube"
        | "facebook"
        | "twitter"
        | "linkedin"
        | "outros"
      status_conta: "ativa" | "pausada" | "banida" | "limitada"
      status_conteudo: "planejado" | "em_producao" | "publicado"
      status_tarefa: "pendente" | "em_andamento" | "concluida" | "nao_concluida"
      tipo_midia: "video" | "imagem" | "carrossel" | "texto"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "colaborador"],
      plataforma_social: [
        "tiktok",
        "instagram",
        "youtube",
        "facebook",
        "twitter",
        "linkedin",
        "outros",
      ],
      status_conta: ["ativa", "pausada", "banida", "limitada"],
      status_conteudo: ["planejado", "em_producao", "publicado"],
      status_tarefa: ["pendente", "em_andamento", "concluida", "nao_concluida"],
      tipo_midia: ["video", "imagem", "carrossel", "texto"],
    },
  },
} as const
