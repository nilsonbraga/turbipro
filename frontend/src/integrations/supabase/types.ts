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
      agencies: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agency_email_oauth: {
        Row: {
          access_token: string | null
          agency_id: string
          created_at: string | null
          email_address: string | null
          id: string
          is_configured: boolean | null
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          agency_id: string
          created_at?: string | null
          email_address?: string | null
          id?: string
          is_configured?: boolean | null
          provider: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          agency_id?: string
          created_at?: string | null
          email_address?: string | null
          id?: string
          is_configured?: boolean | null
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_email_oauth_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_emails: {
        Row: {
          agency_id: string
          bcc_emails: string[] | null
          body_html: string | null
          body_text: string | null
          cc_emails: string[] | null
          created_at: string | null
          folder: string | null
          from_email: string
          from_name: string | null
          id: string
          is_read: boolean | null
          is_sent: boolean | null
          is_starred: boolean | null
          message_id: string | null
          provider: string
          received_at: string | null
          sent_at: string | null
          subject: string
          thread_id: string | null
          to_emails: string[]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agency_id: string
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          folder?: string | null
          from_email: string
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          is_starred?: boolean | null
          message_id?: string | null
          provider?: string
          received_at?: string | null
          sent_at?: string | null
          subject: string
          thread_id?: string | null
          to_emails: string[]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string
          bcc_emails?: string[] | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          folder?: string | null
          from_email?: string
          from_name?: string | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          is_starred?: boolean | null
          message_id?: string | null
          provider?: string
          received_at?: string | null
          sent_at?: string | null
          subject?: string
          thread_id?: string | null
          to_emails?: string[]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_emails_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_resend_config: {
        Row: {
          agency_id: string
          api_key_encrypted: string | null
          created_at: string | null
          from_email: string | null
          from_name: string | null
          id: string
          is_configured: boolean | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          api_key_encrypted?: string | null
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_configured?: boolean | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          api_key_encrypted?: string | null
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_configured?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_resend_config_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_smtp_config: {
        Row: {
          agency_id: string
          created_at: string | null
          id: string
          is_configured: boolean | null
          smtp_from_email: string | null
          smtp_from_name: string | null
          smtp_host: string | null
          smtp_pass_encrypted: string | null
          smtp_port: number | null
          smtp_user: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          created_at?: string | null
          id?: string
          is_configured?: boolean | null
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_pass_encrypted?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          created_at?: string | null
          id?: string
          is_configured?: boolean | null
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_pass_encrypted?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      agency_subscriptions: {
        Row: {
          agency_id: string
          billing_cycle: string
          coupon_id: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          discount_applied: number | null
          grace_period_days: number | null
          id: string
          plan_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          billing_cycle?: string
          coupon_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          discount_applied?: number | null
          grace_period_days?: number | null
          id?: string
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          billing_cycle?: string
          coupon_id?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          discount_applied?: number | null
          grace_period_days?: number | null
          id?: string
          plan_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agency_subscriptions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: true
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_subscriptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "discount_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_whatsapp_config: {
        Row: {
          access_token: string | null
          agency_id: string
          business_account_id: string | null
          created_at: string | null
          id: string
          is_configured: boolean | null
          phone_number_id: string | null
          updated_at: string | null
          webhook_verify_token: string | null
        }
        Insert: {
          access_token?: string | null
          agency_id: string
          business_account_id?: string | null
          created_at?: string | null
          id?: string
          is_configured?: boolean | null
          phone_number_id?: string | null
          updated_at?: string | null
          webhook_verify_token?: string | null
        }
        Update: {
          access_token?: string | null
          agency_id?: string
          business_account_id?: string | null
          created_at?: string | null
          id?: string
          is_configured?: boolean | null
          phone_number_id?: string | null
          updated_at?: string | null
          webhook_verify_token?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          agency_id: string
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          passport: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          agency_id: string
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          passport?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          agency_id?: string
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          passport?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_commissions: {
        Row: {
          agency_id: string
          collaborator_id: string
          commission_amount: number
          commission_base: Database["public"]["Enums"]["commission_base"]
          commission_percentage: number
          created_at: string
          id: string
          period_month: number
          period_year: number
          profit_value: number
          proposal_id: string
          sale_value: number
        }
        Insert: {
          agency_id: string
          collaborator_id: string
          commission_amount?: number
          commission_base?: Database["public"]["Enums"]["commission_base"]
          commission_percentage?: number
          created_at?: string
          id?: string
          period_month: number
          period_year: number
          profit_value?: number
          proposal_id: string
          sale_value?: number
        }
        Update: {
          agency_id?: string
          collaborator_id?: string
          commission_amount?: number
          commission_base?: Database["public"]["Enums"]["commission_base"]
          commission_percentage?: number
          created_at?: string
          id?: string
          period_month?: number
          period_year?: number
          profit_value?: number
          proposal_id?: string
          sale_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_commissions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_commissions_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_commissions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_goals: {
        Row: {
          agency_id: string
          collaborator_id: string
          created_at: string
          id: string
          month: number
          target_deals_count: number
          target_profit: number
          target_sales_value: number
          updated_at: string
          year: number
        }
        Insert: {
          agency_id: string
          collaborator_id: string
          created_at?: string
          id?: string
          month: number
          target_deals_count?: number
          target_profit?: number
          target_sales_value?: number
          updated_at?: string
          year: number
        }
        Update: {
          agency_id?: string
          collaborator_id?: string
          created_at?: string
          id?: string
          month?: number
          target_deals_count?: number
          target_profit?: number
          target_sales_value?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_goals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_goals_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_schedules: {
        Row: {
          agency_id: string
          collaborator_id: string
          created_at: string | null
          end_time: string | null
          id: string
          notes: string | null
          schedule_date: string
          shift_type_id: string | null
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          collaborator_id: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          schedule_date: string
          shift_type_id?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          collaborator_id?: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          schedule_date?: string
          shift_type_id?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_schedules_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_schedules_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_schedules_shift_type_id_fkey"
            columns: ["shift_type_id"]
            isOneToOne: false
            referencedRelation: "shift_types"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborator_time_off: {
        Row: {
          agency_id: string
          collaborator_id: string
          created_at: string | null
          end_date: string
          id: string
          reason: string | null
          start_date: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          collaborator_id: string
          created_at?: string | null
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          collaborator_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_time_off_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborator_time_off_collaborator_id_fkey"
            columns: ["collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
        ]
      }
      collaborators: {
        Row: {
          agency_id: string
          commission_base: Database["public"]["Enums"]["commission_base"]
          commission_percentage: number
          cpf: string | null
          created_at: string
          email: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          id: string
          level: Database["public"]["Enums"]["collaborator_level"] | null
          name: string
          phone: string | null
          position: string | null
          status: string
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agency_id: string
          commission_base?: Database["public"]["Enums"]["commission_base"]
          commission_percentage?: number
          cpf?: string | null
          created_at?: string
          email?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          level?: Database["public"]["Enums"]["collaborator_level"] | null
          name: string
          phone?: string | null
          position?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string
          commission_base?: Database["public"]["Enums"]["commission_base"]
          commission_percentage?: number
          cpf?: string | null
          created_at?: string
          email?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          level?: Database["public"]["Enums"]["collaborator_level"] | null
          name?: string
          phone?: string | null
          position?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborators_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborators_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_itineraries: {
        Row: {
          access_token: string | null
          agency_id: string
          approved_at: string | null
          approved_by: string | null
          client_id: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          destination: string | null
          end_date: string | null
          id: string
          is_active: boolean
          public_token: string
          requires_token: boolean
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          agency_id: string
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          public_token?: string
          requires_token?: boolean
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          agency_id?: string
          approved_at?: string | null
          approved_by?: string | null
          client_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          destination?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          public_token?: string
          requires_token?: boolean
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_itineraries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_itineraries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_itineraries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_coupons: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      expedition_groups: {
        Row: {
          agency_id: string
          carousel_images: string[] | null
          cover_image_url: string | null
          created_at: string
          currency: string | null
          description: string | null
          destination: string
          duration_days: number
          excluded_items: string[] | null
          faqs: Json | null
          google_reviews_url: string | null
          id: string
          included_items: string[] | null
          installments_count: number | null
          is_active: boolean
          landing_text: string | null
          max_participants: number
          price_cash: number | null
          price_installment: number | null
          public_token: string
          show_date_preference: boolean | null
          start_date: string
          testimonials: Json | null
          updated_at: string
          youtube_video_url: string | null
        }
        Insert: {
          agency_id: string
          carousel_images?: string[] | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          destination: string
          duration_days?: number
          excluded_items?: string[] | null
          faqs?: Json | null
          google_reviews_url?: string | null
          id?: string
          included_items?: string[] | null
          installments_count?: number | null
          is_active?: boolean
          landing_text?: string | null
          max_participants?: number
          price_cash?: number | null
          price_installment?: number | null
          public_token?: string
          show_date_preference?: boolean | null
          start_date: string
          testimonials?: Json | null
          updated_at?: string
          youtube_video_url?: string | null
        }
        Update: {
          agency_id?: string
          carousel_images?: string[] | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          destination?: string
          duration_days?: number
          excluded_items?: string[] | null
          faqs?: Json | null
          google_reviews_url?: string | null
          id?: string
          included_items?: string[] | null
          installments_count?: number | null
          is_active?: boolean
          landing_text?: string | null
          max_participants?: number
          price_cash?: number | null
          price_installment?: number | null
          public_token?: string
          show_date_preference?: boolean | null
          start_date?: string
          testimonials?: Json | null
          updated_at?: string
          youtube_video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expedition_groups_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      expedition_registrations: {
        Row: {
          created_at: string
          date_preference: string | null
          email: string
          group_id: string
          id: string
          is_waitlist: boolean
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          created_at?: string
          date_preference?: string | null
          email: string
          group_id: string
          id?: string
          is_waitlist?: boolean
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          date_preference?: string | null
          email?: string
          group_id?: string
          id?: string
          is_waitlist?: boolean
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedition_registrations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "expedition_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          agency_id: string
          category: string | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          current_installment: number | null
          description: string
          details: string | null
          document_name: string | null
          document_number: string | null
          due_date: string | null
          id: string
          installments: number | null
          launch_date: string
          payment_date: string | null
          payment_method: string | null
          profit_value: number | null
          proposal_id: string | null
          status: string
          supplier_id: string | null
          total_value: number
          type: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_installment?: number | null
          description: string
          details?: string | null
          document_name?: string | null
          document_number?: string | null
          due_date?: string | null
          id?: string
          installments?: number | null
          launch_date?: string
          payment_date?: string | null
          payment_method?: string | null
          profit_value?: number | null
          proposal_id?: string | null
          status?: string
          supplier_id?: string | null
          total_value?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_installment?: number | null
          description?: string
          details?: string | null
          document_name?: string | null
          document_number?: string | null
          due_date?: string | null
          id?: string
          installments?: number | null
          launch_date?: string
          payment_date?: string | null
          payment_method?: string | null
          profit_value?: number | null
          proposal_id?: string | null
          status?: string
          supplier_id?: string | null
          total_value?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_day_feedbacks: {
        Row: {
          client_name: string | null
          created_at: string
          day_id: string
          id: string
          is_approved: boolean | null
          observation: string | null
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          day_id: string
          id?: string
          is_approved?: boolean | null
          observation?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          day_id?: string
          id?: string
          is_approved?: boolean | null
          observation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_day_feedbacks_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_days: {
        Row: {
          cover_image_url: string | null
          created_at: string
          date: string | null
          day_number: number
          description: string | null
          id: string
          images: string[] | null
          itinerary_id: string
          location: string | null
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          date?: string | null
          day_number: number
          description?: string | null
          id?: string
          images?: string[] | null
          itinerary_id: string
          location?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          date?: string | null
          day_number?: number
          description?: string | null
          id?: string
          images?: string[] | null
          itinerary_id?: string
          location?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_days_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "custom_itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_item_feedbacks: {
        Row: {
          client_name: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          item_id: string
          observation: string | null
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          item_id: string
          observation?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          item_id?: string
          observation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_item_feedbacks_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itinerary_items"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_items: {
        Row: {
          address: string | null
          booking_reference: string | null
          confirmation_number: string | null
          created_at: string
          currency: string | null
          day_id: string
          description: string | null
          details: Json | null
          end_time: string | null
          id: string
          images: string[] | null
          location: string | null
          price: number | null
          sort_order: number
          start_time: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          booking_reference?: string | null
          confirmation_number?: string | null
          created_at?: string
          currency?: string | null
          day_id: string
          description?: string | null
          details?: Json | null
          end_time?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          price?: number | null
          sort_order?: number
          start_time?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          booking_reference?: string | null
          confirmation_number?: string | null
          created_at?: string
          currency?: string | null
          day_id?: string
          description?: string | null
          details?: Json | null
          end_time?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          price?: number | null
          sort_order?: number
          start_time?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_items_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          agency_id: string
          commission_rate: number | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          commission_rate?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          agency_id: string
          color: string
          created_at: string
          id: string
          is_closed: boolean
          is_lost: boolean
          name: string
          order: number
          updated_at: string
        }
        Insert: {
          agency_id: string
          color?: string
          created_at?: string
          id?: string
          is_closed?: boolean
          is_lost?: boolean
          name: string
          order?: number
          updated_at?: string
        }
        Update: {
          agency_id?: string
          color?: string
          created_at?: string
          id?: string
          is_closed?: boolean
          is_lost?: boolean
          name?: string
          order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_id: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_history: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          proposal_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          proposal_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          proposal_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_history_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_images: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          proposal_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          proposal_id: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          proposal_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_images_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_services: {
        Row: {
          commission_type: string | null
          commission_value: number | null
          cost: number | null
          created_at: string | null
          description: string | null
          destination: string | null
          details: Json | null
          end_date: string | null
          id: string
          origin: string | null
          partner_id: string | null
          proposal_id: string
          start_date: string | null
          type: string
          value: number | null
        }
        Insert: {
          commission_type?: string | null
          commission_value?: number | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          destination?: string | null
          details?: Json | null
          end_date?: string | null
          id?: string
          origin?: string | null
          partner_id?: string | null
          proposal_id: string
          start_date?: string | null
          type: string
          value?: number | null
        }
        Update: {
          commission_type?: string | null
          commission_value?: number | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          destination?: string | null
          details?: Json | null
          end_date?: string | null
          id?: string
          origin?: string | null
          partner_id?: string | null
          proposal_id?: string
          start_date?: string | null
          type?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_services_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_services_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_tags: {
        Row: {
          proposal_id: string
          tag_id: string
        }
        Insert: {
          proposal_id: string
          tag_id: string
        }
        Update: {
          proposal_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_tags_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          agency_id: string
          assigned_collaborator_id: string | null
          client_id: string | null
          commission_type: string | null
          commission_value: number | null
          created_at: string | null
          discount: number | null
          id: string
          notes: string | null
          number: number
          stage_id: string | null
          status: string | null
          title: string
          total_value: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          agency_id: string
          assigned_collaborator_id?: string | null
          client_id?: string | null
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          number?: number
          stage_id?: string | null
          status?: string | null
          title: string
          total_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          agency_id?: string
          assigned_collaborator_id?: string | null
          client_id?: string | null
          commission_type?: string | null
          commission_value?: number | null
          created_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          number?: number
          stage_id?: string | null
          status?: string | null
          title?: string
          total_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_assigned_collaborator_id_fkey"
            columns: ["assigned_collaborator_id"]
            isOneToOne: false
            referencedRelation: "collaborators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      public_proposal_links: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          proposal_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          proposal_id: string
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          proposal_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_proposal_links_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_types: {
        Row: {
          agency_id: string
          color: string | null
          created_at: string | null
          end_time: string
          id: string
          is_active: boolean | null
          name: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          color?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          is_active?: boolean | null
          name: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          color?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_types_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_templates: {
        Row: {
          agency_id: string
          art_type_id: string
          blur_level: number
          colors: Json
          created_at: string
          created_by: string | null
          data: Json
          format_id: string
          icons: Json | null
          id: string
          images: string[] | null
          is_favorite: boolean | null
          logo_url: string | null
          name: string
          template_id: number
          updated_at: string
        }
        Insert: {
          agency_id: string
          art_type_id: string
          blur_level?: number
          colors?: Json
          created_at?: string
          created_by?: string | null
          data?: Json
          format_id: string
          icons?: Json | null
          id?: string
          images?: string[] | null
          is_favorite?: boolean | null
          logo_url?: string | null
          name: string
          template_id: number
          updated_at?: string
        }
        Update: {
          agency_id?: string
          art_type_id?: string
          blur_level?: number
          colors?: Json
          created_at?: string
          created_by?: string | null
          data?: Json
          format_id?: string
          icons?: Json | null
          id?: string
          images?: string[] | null
          is_favorite?: boolean | null
          logo_url?: string | null
          name?: string
          template_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_templates_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_clients: number | null
          max_proposals: number | null
          max_users: number | null
          modules: string[] | null
          name: string
          price_monthly: number
          price_yearly: number
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_clients?: number | null
          max_proposals?: number | null
          max_users?: number | null
          modules?: string[] | null
          name: string
          price_monthly?: number
          price_yearly?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_clients?: number | null
          max_proposals?: number | null
          max_users?: number | null
          modules?: string[] | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          agency_id: string
          created_at: string | null
          document: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          agency_id: string
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          agency_id?: string
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          agency_id: string
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          agency_id: string
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          agency_id?: string
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          created_at: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_columns: {
        Row: {
          agency_id: string
          color: string
          created_at: string | null
          id: string
          is_default: boolean
          name: string
          order: number
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          color?: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          name: string
          order?: number
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          color?: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          name?: string
          order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_columns_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          agency_id: string
          client_id: string | null
          column_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          proposal_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agency_id: string
          client_id?: string | null
          column_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          proposal_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agency_id?: string
          client_id?: string | null
          column_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          proposal_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "task_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      team_goals: {
        Row: {
          agency_id: string
          created_at: string
          id: string
          month: number
          target_deals_count: number
          target_profit: number
          target_sales_value: number
          team_id: string
          updated_at: string
          year: number
        }
        Insert: {
          agency_id: string
          created_at?: string
          id?: string
          month: number
          target_deals_count?: number
          target_profit?: number
          target_sales_value?: number
          team_id: string
          updated_at?: string
          year: number
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          month?: number
          target_deals_count?: number
          target_profit?: number
          target_sales_value?: number
          team_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_goals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_goals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          agency_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          agency_id: string
          client_id: string | null
          contact_name: string | null
          contact_phone: string
          created_at: string | null
          id: string
          last_message_at: string | null
          unread_count: number | null
          updated_at: string | null
          wa_contact_id: string
        }
        Insert: {
          agency_id: string
          client_id?: string | null
          contact_name?: string | null
          contact_phone: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          unread_count?: number | null
          updated_at?: string | null
          wa_contact_id: string
        }
        Update: {
          agency_id?: string
          client_id?: string | null
          contact_name?: string | null
          contact_phone?: string
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          unread_count?: number | null
          updated_at?: string | null
          wa_contact_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          direction: string
          id: string
          media_url: string | null
          message_type: string
          sent_at: string | null
          status: string | null
          wa_message_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          direction: string
          id?: string
          media_url?: string | null
          message_type?: string
          sent_at?: string | null
          status?: string | null
          wa_message_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          media_url?: string | null
          message_type?: string
          sent_at?: string | null
          status?: string | null
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_default_pipeline_stages: {
        Args: { _agency_id: string }
        Returns: undefined
      }
      create_default_task_columns: {
        Args: { _agency_id: string }
        Returns: undefined
      }
      create_default_teams_and_collaborators: {
        Args: { _agency_id: string }
        Returns: undefined
      }
      get_user_agency_id: { Args: { _user_id: string }; Returns: string }
      has_active_subscription: {
        Args: { _agency_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "agent"
      collaborator_level: "junior" | "pleno" | "senior"
      commission_base: "sale_value" | "profit"
      employment_type: "clt" | "pj" | "freela"
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
      app_role: ["super_admin", "admin", "agent"],
      collaborator_level: ["junior", "pleno", "senior"],
      commission_base: ["sale_value", "profit"],
      employment_type: ["clt", "pj", "freela"],
    },
  },
} as const
