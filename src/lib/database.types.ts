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
      bids: {
        Row: {
          bid_amount: number
          created_at: string | null
          id: string
          message: string | null
          project_id: string
          seller_id: string
          status: string | null
        }
        Insert: {
          bid_amount: number
          created_at?: string | null
          id?: string
          message?: string | null
          project_id: string
          seller_id: string
          status?: string | null
        }
        Update: {
          bid_amount?: number
          created_at?: string | null
          id?: string
          message?: string | null
          project_id?: string
          seller_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: 'bids_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          participants: string[]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          participants: string[]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          participants?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'favorites_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'favorites_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      kyc_documents: {
        Row: {
          back_document_url: string | null
          created_at: string | null
          document_type: string
          front_document_url: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          back_document_url?: string | null
          created_at?: string | null
          document_type: string
          front_document_url: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          back_document_url?: string | null
          created_at?: string | null
          document_type?: string
          front_document_url?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'kyc_documents_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'kyc_documents_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      messages: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          message_type: string | null
          metadata: Json | null
          order_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          order_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          order_id?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_receiver_id_fkey'
            columns: ['receiver_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_sender_id_fkey'
            columns: ['sender_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      milestones: {
        Row: {
          amount: number
          buyer_id: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          due_date: string | null
          id: string
          offer_id: string | null
          paid_at: string | null
          payment_id: string | null
          payment_status: string | null
          seller_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          offer_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          seller_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          offer_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_status?: string | null
          seller_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'milestones_offer_id_fkey'
            columns: ['offer_id']
            isOneToOne: false
            referencedRelation: 'offers'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      offer_acceptances: {
        Row: {
          accepted_at: string | null
          buyer_id: string | null
          id: string
          ip_address: unknown | null
          notes: string | null
          offer_id: string | null
          status: string | null
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string | null
          buyer_id?: string | null
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          offer_id?: string | null
          status?: string | null
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string | null
          buyer_id?: string | null
          id?: string
          ip_address?: unknown | null
          notes?: string | null
          offer_id?: string | null
          status?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'offer_acceptances_offer_id_fkey'
            columns: ['offer_id']
            isOneToOne: false
            referencedRelation: 'offers'
            referencedColumns: ['id']
          }
        ]
      }
      offers: {
        Row: {
          add_ons: Json | null
          buyer_id: string | null
          created_at: string | null
          currency: string
          description: string | null
          id: string
          price: number
          seller_id: string
          status: string | null
          timeline_days: number | null
          title: string
        }
        Insert: {
          add_ons?: Json | null
          buyer_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          price: number
          seller_id: string
          status?: string | null
          timeline_days?: number | null
          title: string
        }
        Update: {
          add_ons?: Json | null
          buyer_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          price?: number
          seller_id?: string
          status?: string | null
          timeline_days?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'offers_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'offers_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      orders: {
        Row: {
          buyer_accepted: boolean | null
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          delivery_date: string | null
          delivered_at: string | null
          description: string | null
          id: string
          price: number
          provider_id: string
          proposal_message_id: string | null
          service_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          buyer_accepted?: boolean | null
          buyer_id: string
          completed_at?: string | null
          created_at?: string | null
          delivery_date?: string | null
          delivered_at?: string | null
          description?: string | null
          id?: string
          price: number
          provider_id: string
          proposal_message_id?: string | null
          service_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          buyer_accepted?: boolean | null
          buyer_id?: string
          completed_at?: string | null
          created_at?: string | null
          delivery_date?: string | null
          delivered_at?: string | null
          description?: string | null
          id?: string
          price?: number
          provider_id?: string
          proposal_message_id?: string | null
          service_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'orders_buyer_id_fkey'
            columns: ['buyer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_provider_id_fkey'
            columns: ['provider_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_service_id_fkey'
            columns: ['service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['id']
          }
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          order_id: string
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id: string
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          order_id?: string
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payments_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          }
        ]
      }
      token_plans: {
        Row: {
          active_purchases: number
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price: number
          slug: string
          tokens: number
          total_revenue: number
          updated_at: string
        }
        Insert: {
          active_purchases?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price: number
          slug: string
          tokens: number
          total_revenue?: number
          updated_at?: string
        }
        Update: {
          active_purchases?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price?: number
          slug?: string
          tokens?: number
          total_revenue?: number
          updated_at?: string
        }
        Relationships: []
      }
      token_purchases: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          plan_id: string
          seller_id: string
          status: string
          tokens: number
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          plan_id: string
          seller_id: string
          status?: string
          tokens: number
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          plan_id?: string
          seller_id?: string
          status?: string
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: 'token_purchases_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'token_plans'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'token_purchases_seller_id_fkey'
            columns: ['seller_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      platform_settings: {
        Row: {
          fb_pixel_id: string | null
          ga_measurement_id: string | null
          gtm_id: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          fb_pixel_id?: string | null
          ga_measurement_id?: string | null
          gtm_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          fb_pixel_id?: string | null
          ga_measurement_id?: string | null
          gtm_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          category: string
          client_name: string | null
          completion_date: string | null
          created_at: string
          description: string
          id: string
          images: string[] | null
          is_featured: boolean
          project_url: string | null
          provider_id: string
          rating: number | null
          tags: string[] | null
          testimonial: string | null
        }
        Insert: {
          category: string
          client_name?: string | null
          completion_date?: string | null
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          is_featured: boolean
          project_url?: string | null
          provider_id: string
          rating?: number | null
          tags?: string[] | null
          testimonial?: string | null
        }
        Update: {
          category?: string
          client_name?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          is_featured?: boolean
          project_url?: string | null
          provider_id?: string
          rating?: number | null
          tags?: string[] | null
          testimonial?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'portfolios_provider_id_fkey'
            columns: ['provider_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      projects: {
        Row: {
          attachments: string[] | null
          budget: number | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_draft: boolean | null
          is_featured: boolean | null
          is_private: boolean | null
          is_template: boolean | null
          location: string | null
          name: string
          owner_id: string
          price: number | null
          status: string | null
          tags: string[] | null
          timeline_days: number | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          budget?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_draft?: boolean | null
          is_featured?: boolean | null
          is_private?: boolean | null
          is_template?: boolean | null
          location?: string | null
          name: string
          owner_id: string
          price?: number | null
          status?: string | null
          tags?: string[] | null
          timeline_days?: number | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          budget?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_draft?: boolean | null
          is_featured?: boolean | null
          is_private?: boolean | null
          is_template?: boolean | null
          location?: string | null
          name?: string
          owner_id?: string
          price?: number | null
          status?: string | null
          tags?: string[] | null
          timeline_days?: number | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'projects_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_reviewee_id_fkey'
            columns: ['reviewee_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reviews_reviewer_id_fkey'
            columns: ['reviewer_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      services: {
        Row: {
          attachments: string[] | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_draft: boolean | null
          is_private: boolean | null
          is_template: boolean | null
          location: string | null
          name: string
          owner_id: string
          price: number | null
          status: string | null
          tags: string[] | null
          timeline_days: number | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_draft?: boolean | null
          is_private?: boolean | null
          is_template?: boolean | null
          location?: string | null
          name: string
          owner_id: string
          price?: number | null
          status?: string | null
          tags?: string[] | null
          timeline_days?: number | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: string[] | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_draft?: boolean | null
          is_private?: boolean | null
          is_template?: boolean | null
          location?: string | null
          name?: string
          owner_id?: string
          price?: number | null
          status?: string | null
          tags?: string[] | null
          timeline_days?: number | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'services_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          is_buyer: boolean | null
          is_provider: boolean | null
          is_verified: boolean | null
          name: string | null
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_buyer?: boolean | null
          is_provider?: boolean | null
          is_verified?: boolean | null
          name?: string | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          is_buyer?: boolean | null
          is_provider?: boolean | null
          is_verified?: boolean | null
          name?: string | null
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
