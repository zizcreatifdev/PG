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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action_type: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string
          user_name: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id: string
          user_name?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      agency_settings: {
        Row: {
          email_contact: string
          id: string
          nom_agence: string
          seuil_alerte_images_global: number
          updated_at: string
        }
        Insert: {
          email_contact?: string
          id?: string
          nom_agence?: string
          seuil_alerte_images_global?: number
          updated_at?: string
        }
        Update: {
          email_contact?: string
          id?: string
          nom_agence?: string
          seuil_alerte_images_global?: number
          updated_at?: string
        }
        Relationships: []
      }
      client_images: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          shooting_history_id: string | null
          used_in_post_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          shooting_history_id?: string | null
          used_in_post_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          shooting_history_id?: string | null
          used_in_post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_images_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_images_shooting_history_id_fkey"
            columns: ["shooting_history_id"]
            isOneToOne: false
            referencedRelation: "shooting_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_images_used_in_post_id_fkey"
            columns: ["used_in_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          archived: boolean | null
          audience_cible: string | null
          biographie: string | null
          created_at: string
          created_by: string | null
          date_debut: string | null
          date_renouvellement: string | null
          email: string | null
          entreprise: string | null
          formule: string | null
          frequence_q1: number | null
          frequence_q2: number | null
          frequence_q3: number | null
          frequence_q4: number | null
          id: string
          linkedin_url: string | null
          montant_mensuel_xof: number | null
          nom: string
          notes: string | null
          notes_internes: string | null
          objectifs_linkedin: string[] | null
          photo_url: string | null
          piliers_contenu: string[] | null
          secteur_activite: string | null
          seuil_alerte_images: number | null
          statut: Database["public"]["Enums"]["client_status"]
          statut_paiement: string | null
          stock_images: number | null
          style_ecriture: string | null
          sujets_a_eviter: string | null
          telephone: string | null
          titre_professionnel: string | null
          ton_voix: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          archived?: boolean | null
          audience_cible?: string | null
          biographie?: string | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_renouvellement?: string | null
          email?: string | null
          entreprise?: string | null
          formule?: string | null
          frequence_q1?: number | null
          frequence_q2?: number | null
          frequence_q3?: number | null
          frequence_q4?: number | null
          id?: string
          linkedin_url?: string | null
          montant_mensuel_xof?: number | null
          nom: string
          notes?: string | null
          notes_internes?: string | null
          objectifs_linkedin?: string[] | null
          photo_url?: string | null
          piliers_contenu?: string[] | null
          secteur_activite?: string | null
          seuil_alerte_images?: number | null
          statut?: Database["public"]["Enums"]["client_status"]
          statut_paiement?: string | null
          stock_images?: number | null
          style_ecriture?: string | null
          sujets_a_eviter?: string | null
          telephone?: string | null
          titre_professionnel?: string | null
          ton_voix?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          archived?: boolean | null
          audience_cible?: string | null
          biographie?: string | null
          created_at?: string
          created_by?: string | null
          date_debut?: string | null
          date_renouvellement?: string | null
          email?: string | null
          entreprise?: string | null
          formule?: string | null
          frequence_q1?: number | null
          frequence_q2?: number | null
          frequence_q3?: number | null
          frequence_q4?: number | null
          id?: string
          linkedin_url?: string | null
          montant_mensuel_xof?: number | null
          nom?: string
          notes?: string | null
          notes_internes?: string | null
          objectifs_linkedin?: string[] | null
          photo_url?: string | null
          piliers_contenu?: string[] | null
          secteur_activite?: string | null
          seuil_alerte_images?: number | null
          statut?: Database["public"]["Enums"]["client_status"]
          statut_paiement?: string | null
          stock_images?: number | null
          style_ecriture?: string | null
          sujets_a_eviter?: string | null
          telephone?: string | null
          titre_professionnel?: string | null
          ton_voix?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          contenu: string
          id: string
          nom: string
          type: string
          updated_at: string
        }
        Insert: {
          contenu?: string
          id?: string
          nom: string
          type: string
          updated_at?: string
        }
        Update: {
          contenu?: string
          id?: string
          nom?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          categorie: string
          created_at: string
          created_by: string | null
          date_depense: string
          description: string
          id: string
          montant_xof: number
        }
        Insert: {
          categorie?: string
          created_at?: string
          created_by?: string | null
          date_depense?: string
          description?: string
          id?: string
          montant_xof?: number
        }
        Update: {
          categorie?: string
          created_at?: string
          created_by?: string | null
          date_depense?: string
          description?: string
          id?: string
          montant_xof?: number
        }
        Relationships: []
      }
      formules: {
        Row: {
          actif: boolean
          afficher_landing: boolean
          badge: string | null
          contract_template: string | null
          contract_type: string
          created_at: string
          description: string
          features: string[]
          id: string
          nom: string
          prix_xof: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          afficher_landing?: boolean
          badge?: string | null
          contract_template?: string | null
          contract_type?: string
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          nom: string
          prix_xof?: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          afficher_landing?: boolean
          badge?: string | null
          contract_template?: string | null
          contract_type?: string
          created_at?: string
          description?: string
          features?: string[]
          id?: string
          nom?: string
          prix_xof?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoice_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          prix_unitaire_xof: number
          quantite: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          prix_unitaire_xof?: number
          quantite?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          prix_unitaire_xof?: number
          quantite?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          date_echeance: string
          date_emission: string
          id: string
          montant_xof: number
          numero: string
          statut: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          date_echeance: string
          date_emission?: string
          id?: string
          montant_xof?: number
          numero: string
          statut?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          date_echeance?: string
          date_emission?: string
          id?: string
          montant_xof?: number
          numero?: string
          statut?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_config: {
        Row: {
          content: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      moodboard_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          shooting_plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          shooting_plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          shooting_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moodboard_images_shooting_plan_id_fkey"
            columns: ["shooting_plan_id"]
            isOneToOne: false
            referencedRelation: "shooting_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_tokens: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          token: string
          used: boolean
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          date_paiement: string
          id: string
          methode: string | null
          montant_xof: number
          notes: string | null
          reference: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          date_paiement: string
          id?: string
          methode?: string | null
          montant_xof?: number
          notes?: string | null
          reference?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          date_paiement?: string
          id?: string
          methode?: string | null
          montant_xof?: number
          notes?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          client_id: string
          contenu: string
          created_at: string
          created_by: string | null
          date_planifiee: string
          format: string
          heure_publication: string | null
          id: string
          media_url: string | null
          sondage_options: string[] | null
          sondage_question: string | null
          statut: Database["public"]["Enums"]["post_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          contenu?: string
          created_at?: string
          created_by?: string | null
          date_planifiee: string
          format?: string
          heure_publication?: string | null
          id?: string
          media_url?: string | null
          sondage_options?: string[] | null
          sondage_question?: string | null
          statut?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          contenu?: string
          created_at?: string
          created_by?: string | null
          date_planifiee?: string
          format?: string
          heure_publication?: string | null
          id?: string
          media_url?: string | null
          sondage_options?: string[] | null
          sondage_question?: string | null
          statut?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nom: string
          prenom: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom?: string
          prenom?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
          prenom?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prospect_submissions: {
        Row: {
          accepted_terms: boolean
          client_id: string | null
          created_at: string
          email: string
          formule_id: string | null
          formule_name: string
          id: string
          linkedin_url: string | null
          message: string | null
          nom: string
          prenom: string
          profession: string
          signature_image: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["submission_status"]
          whatsapp: string
        }
        Insert: {
          accepted_terms?: boolean
          client_id?: string | null
          created_at?: string
          email: string
          formule_id?: string | null
          formule_name?: string
          id?: string
          linkedin_url?: string | null
          message?: string | null
          nom: string
          prenom: string
          profession?: string
          signature_image?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          whatsapp?: string
        }
        Update: {
          accepted_terms?: boolean
          client_id?: string | null
          created_at?: string
          email?: string
          formule_id?: string | null
          formule_name?: string
          id?: string
          linkedin_url?: string | null
          message?: string | null
          nom?: string
          prenom?: string
          profession?: string
          signature_image?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospect_submissions_formule_id_fkey"
            columns: ["formule_id"]
            isOneToOne: false
            referencedRelation: "formules"
            referencedColumns: ["id"]
          },
        ]
      }
      shooting_history: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          date_shooting: string
          id: string
          lieu: string
          nombre_photos: number
          notes: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          date_shooting: string
          id?: string
          lieu?: string
          nombre_photos?: number
          notes?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          date_shooting?: string
          id?: string
          lieu?: string
          nombre_photos?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shooting_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      shooting_plans: {
        Row: {
          budget_estime_xof: number
          client_id: string
          commentaire_client: string | null
          created_at: string
          created_by: string | null
          date_proposee: string
          id: string
          lieu: string
          option_type: string
          statut: string
          tenues_suggerees: string | null
          updated_at: string
        }
        Insert: {
          budget_estime_xof?: number
          client_id: string
          commentaire_client?: string | null
          created_at?: string
          created_by?: string | null
          date_proposee: string
          id?: string
          lieu?: string
          option_type?: string
          statut?: string
          tenues_suggerees?: string | null
          updated_at?: string
        }
        Update: {
          budget_estime_xof?: number
          client_id?: string
          commentaire_client?: string | null
          created_at?: string
          created_by?: string | null
          date_proposee?: string
          id?: string
          lieu?: string
          option_type?: string
          statut?: string
          tenues_suggerees?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shooting_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "client"
      client_status: "actif" | "pause" | "termine"
      invoice_status: "en_attente" | "payee" | "en_retard"
      post_status:
        | "brouillon"
        | "valide"
        | "publie"
        | "propose"
        | "modifie"
        | "approuve"
        | "poste"
      submission_status: "en_attente" | "signed" | "converti" | "rejete"
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
      app_role: ["admin", "staff", "client"],
      client_status: ["actif", "pause", "termine"],
      invoice_status: ["en_attente", "payee", "en_retard"],
      post_status: [
        "brouillon",
        "valide",
        "publie",
        "propose",
        "modifie",
        "approuve",
        "poste",
      ],
      submission_status: ["en_attente", "signed", "converti", "rejete"],
    },
  },
} as const
