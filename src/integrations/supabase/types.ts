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
      account_logs: {
        Row: {
          account_id: string
          action_type: string
          created_at: string
          description: string | null
          id: string
          nicho_id: string
          user_id: string
        }
        Insert: {
          account_id: string
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          nicho_id: string
          user_id: string
        }
        Update: {
          account_id?: string
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          nicho_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "contas_redes_sociais"
            referencedColumns: ["id"]
          },
        ]
      }
      account_routine_items: {
        Row: {
          account_id: string
          completed_at: string | null
          created_at: string
          id: string
          nicho_id: string
          order: number
          recurring: boolean
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          account_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          nicho_id: string
          order?: number
          recurring?: boolean
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          nicho_id?: string
          order?: number
          recurring?: boolean
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_routine_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "contas_redes_sociais"
            referencedColumns: ["id"]
          },
        ]
      }
      account_task_days: {
        Row: {
          account_id: string
          completed_at: string | null
          created_at: string
          id: string
          nicho_id: string
          status: string
          task_id: string
          updated_at: string
          week_reference: string
          weekday: number
        }
        Insert: {
          account_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          nicho_id: string
          status?: string
          task_id: string
          updated_at?: string
          week_reference: string
          weekday: number
        }
        Update: {
          account_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          nicho_id?: string
          status?: string
          task_id?: string
          updated_at?: string
          week_reference?: string
          weekday?: number
        }
        Relationships: []
      }
      account_tasks: {
        Row: {
          account_id: string
          created_at: string
          id: string
          is_active: boolean
          nicho_id: string
          task_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          nicho_id: string
          task_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          nicho_id?: string
          task_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      applab_account_links: {
        Row: {
          app_id: string
          conta_id: string
          created_at: string
          data_inicio_teste: string | null
          duracao_teste: string | null
          id: string
          nicho_id: string
          observacao: string | null
          status_vinculo: string
          validando: string | null
        }
        Insert: {
          app_id: string
          conta_id: string
          created_at?: string
          data_inicio_teste?: string | null
          duracao_teste?: string | null
          id?: string
          nicho_id: string
          observacao?: string | null
          status_vinculo?: string
          validando?: string | null
        }
        Update: {
          app_id?: string
          conta_id?: string
          created_at?: string
          data_inicio_teste?: string | null
          duracao_teste?: string | null
          id?: string
          nicho_id?: string
          observacao?: string | null
          status_vinculo?: string
          validando?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applab_account_links_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "applab_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applab_account_links_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_redes_sociais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applab_account_links_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      applab_apps: {
        Row: {
          created_at: string
          descricao_curta: string | null
          id: string
          nicho_id: string
          nome_app: string
          observacoes: string | null
          status_teste: string
          updated_at: string
          usuarios_ativos: number | null
          usuarios_ativos_atualizado_em: string | null
        }
        Insert: {
          created_at?: string
          descricao_curta?: string | null
          id?: string
          nicho_id: string
          nome_app: string
          observacoes?: string | null
          status_teste?: string
          updated_at?: string
          usuarios_ativos?: number | null
          usuarios_ativos_atualizado_em?: string | null
        }
        Update: {
          created_at?: string
          descricao_curta?: string | null
          id?: string
          nicho_id?: string
          nome_app?: string
          observacoes?: string | null
          status_teste?: string
          updated_at?: string
          usuarios_ativos?: number | null
          usuarios_ativos_atualizado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applab_apps_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_redes_sociais: {
        Row: {
          aquecimento_ativo: boolean | null
          aquecimento_inicio: string | null
          aquecimento_meta_dias: number | null
          banned_at: string | null
          created_at: string | null
          data_criacao_conta: string | null
          disabled_at: string | null
          gmail_email: string | null
          gmail_senha: string | null
          id: string
          login_email: string | null
          media_videos: number | null
          nicho_id: string
          nome_conta: string
          observacoes: string | null
          ordem: number | null
          pais: string | null
          pin: string | null
          plataforma: Database["public"]["Enums"]["plataforma_social"]
          proxima_acao: string | null
          responsavel_id: string | null
          senha_acesso: string | null
          status: Database["public"]["Enums"]["status_conta"] | null
          status_aquecimento: string | null
          telefone: string | null
          tipo_conteudo: string | null
          ultima_acao: string | null
          updated_at: string | null
          url_conta: string | null
          url_site: string | null
          username: string | null
        }
        Insert: {
          aquecimento_ativo?: boolean | null
          aquecimento_inicio?: string | null
          aquecimento_meta_dias?: number | null
          banned_at?: string | null
          created_at?: string | null
          data_criacao_conta?: string | null
          disabled_at?: string | null
          gmail_email?: string | null
          gmail_senha?: string | null
          id?: string
          login_email?: string | null
          media_videos?: number | null
          nicho_id: string
          nome_conta: string
          observacoes?: string | null
          ordem?: number | null
          pais?: string | null
          pin?: string | null
          plataforma: Database["public"]["Enums"]["plataforma_social"]
          proxima_acao?: string | null
          responsavel_id?: string | null
          senha_acesso?: string | null
          status?: Database["public"]["Enums"]["status_conta"] | null
          status_aquecimento?: string | null
          telefone?: string | null
          tipo_conteudo?: string | null
          ultima_acao?: string | null
          updated_at?: string | null
          url_conta?: string | null
          url_site?: string | null
          username?: string | null
        }
        Update: {
          aquecimento_ativo?: boolean | null
          aquecimento_inicio?: string | null
          aquecimento_meta_dias?: number | null
          banned_at?: string | null
          created_at?: string | null
          data_criacao_conta?: string | null
          disabled_at?: string | null
          gmail_email?: string | null
          gmail_senha?: string | null
          id?: string
          login_email?: string | null
          media_videos?: number | null
          nicho_id?: string
          nome_conta?: string
          observacoes?: string | null
          ordem?: number | null
          pais?: string | null
          pin?: string | null
          plataforma?: Database["public"]["Enums"]["plataforma_social"]
          proxima_acao?: string | null
          responsavel_id?: string | null
          senha_acesso?: string | null
          status?: Database["public"]["Enums"]["status_conta"] | null
          status_aquecimento?: string | null
          telefone?: string | null
          tipo_conteudo?: string | null
          ultima_acao?: string | null
          updated_at?: string | null
          url_conta?: string | null
          url_site?: string | null
          username?: string | null
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
      nichos: {
        Row: {
          applab_habilitado: boolean
          contas_habilitado: boolean
          created_at: string | null
          dashboard_habilitado: boolean
          descricao: string | null
          id: string
          nome: string
          observacoes: string | null
          updated_at: string | null
        }
        Insert: {
          applab_habilitado?: boolean
          contas_habilitado?: boolean
          created_at?: string | null
          dashboard_habilitado?: boolean
          descricao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          updated_at?: string | null
        }
        Update: {
          applab_habilitado?: boolean
          contas_habilitado?: boolean
          created_at?: string | null
          dashboard_habilitado?: boolean
          descricao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      planner_notes: {
        Row: {
          archived: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_day: string
          horario: string | null
          id: string
          is_recovered: boolean
          nicho_id: string
          recovered_from: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_day?: string
          horario?: string | null
          id?: string
          is_recovered?: boolean
          nicho_id: string
          recovered_from?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_day?: string
          horario?: string | null
          id?: string
          is_recovered?: boolean
          nicho_id?: string
          recovered_from?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_color: string | null
          avatar_emoji: string | null
          created_at: string | null
          data_entrada: string | null
          email: string
          id: string
          nome: string
          observacoes: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_color?: string | null
          avatar_emoji?: string | null
          created_at?: string | null
          data_entrada?: string | null
          email: string
          id: string
          nome: string
          observacoes?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_color?: string | null
          avatar_emoji?: string | null
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
      testes_rapidos: {
        Row: {
          created_at: string
          hipotese: string
          id: string
          nicho_id: string
          plataforma: string
          resultado_percebido: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hipotese: string
          id?: string
          nicho_id: string
          plataforma: string
          resultado_percebido?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hipotese?: string
          id?: string
          nicho_id?: string
          plataforma?: string
          resultado_percebido?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testes_rapidos_nicho_id_fkey"
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
      workspace_links: {
        Row: {
          created_at: string | null
          id: string
          nicho_id: string
          provider: string | null
          title: string
          type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nicho_id: string
          provider?: string | null
          title?: string
          type: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nicho_id?: string
          provider?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_links_nicho_id_fkey"
            columns: ["nicho_id"]
            isOneToOne: false
            referencedRelation: "nichos"
            referencedColumns: ["id"]
          },
        ]
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
      meta_status: "on_track" | "atencao" | "longe"
      modelo_pagamento: "porcentagem" | "valor_fixo"
      plataforma_social:
        | "tiktok"
        | "instagram"
        | "youtube"
        | "facebook"
        | "twitter"
        | "linkedin"
        | "outros"
        | "whatsapp"
        | "telegram"
        | "site"
      status_cliente: "rodando" | "pausado" | "finalizado"
      status_conta: "ativa" | "pausada" | "banida" | "limitada"
      status_conteudo: "planejado" | "em_producao" | "publicado"
      status_pedido: "pendente" | "enviado" | "cancelado"
      status_tarefa: "pendente" | "em_andamento" | "concluida" | "nao_concluida"
      status_tarefa_cliente: "pendente" | "feito"
      tipo_cliente: "influencer" | "negocio_local"
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
      meta_status: ["on_track", "atencao", "longe"],
      modelo_pagamento: ["porcentagem", "valor_fixo"],
      plataforma_social: [
        "tiktok",
        "instagram",
        "youtube",
        "facebook",
        "twitter",
        "linkedin",
        "outros",
        "whatsapp",
        "telegram",
        "site",
      ],
      status_cliente: ["rodando", "pausado", "finalizado"],
      status_conta: ["ativa", "pausada", "banida", "limitada"],
      status_conteudo: ["planejado", "em_producao", "publicado"],
      status_pedido: ["pendente", "enviado", "cancelado"],
      status_tarefa: ["pendente", "em_andamento", "concluida", "nao_concluida"],
      status_tarefa_cliente: ["pendente", "feito"],
      tipo_cliente: ["influencer", "negocio_local"],
      tipo_midia: ["video", "imagem", "carrossel", "texto"],
    },
  },
} as const
