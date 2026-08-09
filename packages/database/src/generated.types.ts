export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          assigned_reviewer: string | null
          consent_to_contact: boolean
          created_at: string
          email: string
          first_name: string
          id: string
          known_leader: string | null
          last_name: string
          phone: string | null
          reason: string
          relationship_to_church: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_ip_hash: string | null
          source_user_agent_hash: string | null
          status: Database["public"]["Enums"]["access_request_status"]
          updated_at: string
        }
        Insert: {
          assigned_reviewer?: string | null
          consent_to_contact?: boolean
          created_at?: string
          email: string
          first_name: string
          id?: string
          known_leader?: string | null
          last_name: string
          phone?: string | null
          reason: string
          relationship_to_church: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_ip_hash?: string | null
          source_user_agent_hash?: string | null
          status?: Database["public"]["Enums"]["access_request_status"]
          updated_at?: string
        }
        Update: {
          assigned_reviewer?: string | null
          consent_to_contact?: boolean
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          known_leader?: string | null
          last_name?: string
          phone?: string | null
          reason?: string
          relationship_to_church?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_ip_hash?: string | null
          source_user_agent_hash?: string | null
          status?: Database["public"]["Enums"]["access_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_assigned_reviewer_fkey"
            columns: ["assigned_reviewer"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      access_reviews: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          findings: Json
          id: string
          opened_at: string
          opened_by: string
          review_period_end: string
          review_period_start: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          findings?: Json
          id?: string
          opened_at?: string
          opened_by: string
          review_period_end: string
          review_period_start: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          findings?: Json
          id?: string
          opened_at?: string
          opened_by?: string
          review_period_end?: string
          review_period_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_reviews_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_reviews_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_citations: {
        Row: {
          ai_request_id: string
          approved_document_id: string
          created_at: string
          document_chunk_id: string | null
          excerpt: string | null
          id: string
          label: string
          position: number
        }
        Insert: {
          ai_request_id: string
          approved_document_id: string
          created_at?: string
          document_chunk_id?: string | null
          excerpt?: string | null
          id?: string
          label: string
          position?: number
        }
        Update: {
          ai_request_id?: string
          approved_document_id?: string
          created_at?: string
          document_chunk_id?: string | null
          excerpt?: string | null
          id?: string
          label?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_citations_ai_request_id_fkey"
            columns: ["ai_request_id"]
            isOneToOne: false
            referencedRelation: "ai_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_approved_document_id_fkey"
            columns: ["approved_document_id"]
            isOneToOne: false
            referencedRelation: "approved_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_citations_document_chunk_id_fkey"
            columns: ["document_chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedback: {
        Row: {
          ai_request_id: string
          created_at: string
          feedback: string | null
          helpful: boolean | null
          id: string
          profile_id: string
          rating: number | null
        }
        Insert: {
          ai_request_id: string
          created_at?: string
          feedback?: string | null
          helpful?: boolean | null
          id?: string
          profile_id: string
          rating?: number | null
        }
        Update: {
          ai_request_id?: string
          created_at?: string
          feedback?: string | null
          helpful?: boolean | null
          id?: string
          profile_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_ai_request_id_fkey"
            columns: ["ai_request_id"]
            isOneToOne: false
            referencedRelation: "ai_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_requests: {
        Row: {
          approved_document_ids: string[]
          created_at: string
          estimated_cost_usd: number | null
          id: string
          input_tokens: number | null
          model_name: string | null
          model_provider: string | null
          output_tokens: number | null
          prompt: string
          prompt_version: string | null
          request_type: string
          requester_id: string
          response_draft: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          safety_flags: string[]
          status: Database["public"]["Enums"]["ai_request_status"]
          updated_at: string
        }
        Insert: {
          approved_document_ids?: string[]
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          model_name?: string | null
          model_provider?: string | null
          output_tokens?: number | null
          prompt: string
          prompt_version?: string | null
          request_type: string
          requester_id: string
          response_draft?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_flags?: string[]
          status?: Database["public"]["Enums"]["ai_request_status"]
          updated_at?: string
        }
        Update: {
          approved_document_ids?: string[]
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          input_tokens?: number | null
          model_name?: string | null
          model_provider?: string | null
          output_tokens?: number | null
          prompt?: string
          prompt_version?: string | null
          request_type?: string
          requester_id?: string
          response_draft?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_flags?: string[]
          status?: Database["public"]["Enums"]["ai_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_visibility_checks: {
        Row: {
          checked_at: string
          church_mentioned: boolean | null
          content_gap: string | null
          coverage_score: number
          evidence_excerpt: string | null
          facts_accurate: boolean | null
          id: string
          prompt: string
          public_evidence_urls: string[]
          run_id: string
        }
        Insert: {
          checked_at?: string
          church_mentioned?: boolean | null
          content_gap?: string | null
          coverage_score: number
          evidence_excerpt?: string | null
          facts_accurate?: boolean | null
          id?: string
          prompt: string
          public_evidence_urls?: string[]
          run_id: string
        }
        Update: {
          checked_at?: string
          church_mentioned?: boolean | null
          content_gap?: string | null
          coverage_score?: number
          evidence_excerpt?: string | null
          facts_accurate?: boolean | null
          id?: string
          prompt?: string
          public_evidence_urls?: string[]
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_visibility_checks_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ai_visibility_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_visibility_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          dry_run: boolean
          error_summary: string | null
          id: string
          locality: string
          prompt_count: number
          provider_key: string
          requested_by: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          dry_run?: boolean
          error_summary?: string | null
          id?: string
          locality: string
          prompt_count: number
          provider_key: string
          requested_by?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          dry_run?: boolean
          error_summary?: string | null
          id?: string
          locality?: string
          prompt_count?: number
          provider_key?: string
          requested_by?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_visibility_runs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          event_id: string | null
          group_id: string | null
          household_id: string | null
          id: string
          kids_class_id: string | null
          scope: Database["public"]["Enums"]["media_scope"]
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          event_id?: string | null
          group_id?: string | null
          household_id?: string | null
          id?: string
          kids_class_id?: string | null
          scope: Database["public"]["Enums"]["media_scope"]
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          event_id?: string | null
          group_id?: string | null
          household_id?: string | null
          id?: string
          kids_class_id?: string | null
          scope?: Database["public"]["Enums"]["media_scope"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_kids_class_id_fkey"
            columns: ["kids_class_id"]
            isOneToOne: false
            referencedRelation: "kids_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      approved_documents: {
        Row: {
          access_scope: string
          approved_at: string | null
          approved_by: string | null
          checksum: string | null
          content: string | null
          created_at: string
          document_type: string
          id: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          source_url: string | null
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access_scope?: string
          approved_at?: string | null
          approved_by?: string | null
          checksum?: string | null
          content?: string | null
          created_at?: string
          document_type: string
          id?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          source_url?: string | null
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access_scope?: string
          approved_at?: string | null
          approved_by?: string | null
          checksum?: string | null
          content?: string | null
          created_at?: string
          document_type?: string
          id?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          source_url?: string | null
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approved_documents_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_links: {
        Row: {
          attendance_status: string
          event_occurrence_id: string
          external_reference: string | null
          id: string
          profile_id: string | null
          recorded_at: string
          recorded_by: string | null
        }
        Insert: {
          attendance_status: string
          event_occurrence_id: string
          external_reference?: string | null
          id?: string
          profile_id?: string | null
          recorded_at?: string
          recorded_by?: string | null
        }
        Update: {
          attendance_status?: string
          event_occurrence_id?: string
          external_reference?: string | null
          id?: string
          profile_id?: string | null
          recorded_at?: string
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_links_event_occurrence_id_fkey"
            columns: ["event_occurrence_id"]
            isOneToOne: false
            referencedRelation: "event_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_links_event_occurrence_id_fkey"
            columns: ["event_occurrence_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["occurrence_id"]
          },
          {
            foreignKeyName: "attendance_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_links_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          id: string
          ip_hash: string | null
          metadata: Json
          occurred_at: string
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          occurred_at?: string
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          occurred_at?: string
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_pickups: {
        Row: {
          active: boolean
          authorized_by_guardian: string
          child_id: string
          created_at: string
          display_name: string
          id: string
          phone_last_four: string | null
          pickup_profile_id: string | null
          relationship_label: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          authorized_by_guardian: string
          child_id: string
          created_at?: string
          display_name: string
          id?: string
          phone_last_four?: string | null
          pickup_profile_id?: string | null
          relationship_label?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          authorized_by_guardian?: string
          child_id?: string
          created_at?: string
          display_name?: string
          id?: string
          phone_last_four?: string | null
          pickup_profile_id?: string | null
          relationship_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorized_pickups_authorized_by_guardian_fkey"
            columns: ["authorized_by_guardian"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorized_pickups_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorized_pickups_pickup_profile_id_fkey"
            columns: ["pickup_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_restore_tests: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string
          evidence_location: string | null
          id: string
          notes: string | null
          recovery_point_at: string | null
          recovery_time_minutes: number | null
          started_at: string
          status: string
          tested_by: string | null
        }
        Insert: {
          backup_type: string
          completed_at?: string | null
          created_at?: string
          evidence_location?: string | null
          id?: string
          notes?: string | null
          recovery_point_at?: string | null
          recovery_time_minutes?: number | null
          started_at: string
          status: string
          tested_by?: string | null
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          evidence_location?: string | null
          id?: string
          notes?: string | null
          recovery_point_at?: string | null
          recovery_time_minutes?: number | null
          started_at?: string
          status?: string
          tested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_restore_tests_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_journey_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          journey_id: string
          personal_notes: string | null
          profile_id: string
          rhythm_state: Json
          saved_question: string | null
          updated_at: string
          week_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          journey_id: string
          personal_notes?: string | null
          profile_id: string
          rhythm_state?: Json
          saved_question?: string | null
          updated_at?: string
          week_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          journey_id?: string
          personal_notes?: string | null
          profile_id?: string
          rhythm_state?: Json
          saved_question?: string | null
          updated_at?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_journey_progress_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "bible_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_journey_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_journey_progress_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "bible_journey_weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_journey_weeks: {
        Row: {
          approved_ai_context: Json
          big_idea: string
          created_at: string
          created_by: string | null
          discussion_tracks: Json
          era: string
          id: string
          journey_id: string
          practice_prompts: Json
          publication_status: Database["public"]["Enums"]["publication_status"]
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          scripture_references: string[]
          story_movements: Json
          summary: string
          title: string
          updated_at: string
          week_number: number
          weekly_lesson_id: string | null
        }
        Insert: {
          approved_ai_context?: Json
          big_idea: string
          created_at?: string
          created_by?: string | null
          discussion_tracks?: Json
          era: string
          id?: string
          journey_id: string
          practice_prompts?: Json
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          reviewed_by?: string | null
          scripture_references: string[]
          story_movements?: Json
          summary: string
          title: string
          updated_at?: string
          week_number: number
          weekly_lesson_id?: string | null
        }
        Update: {
          approved_ai_context?: Json
          big_idea?: string
          created_at?: string
          created_by?: string | null
          discussion_tracks?: Json
          era?: string
          id?: string
          journey_id?: string
          practice_prompts?: Json
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          reviewed_by?: string | null
          scripture_references?: string[]
          story_movements?: Json
          summary?: string
          title?: string
          updated_at?: string
          week_number?: number
          weekly_lesson_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bible_journey_weeks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_journey_weeks_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "bible_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_journey_weeks_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_journey_weeks_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_journey_weeks_weekly_lesson_id_fkey"
            columns: ["weekly_lesson_id"]
            isOneToOne: false
            referencedRelation: "weekly_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_journeys: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          starts_on: string | null
          subtitle: string | null
          title: string
          total_weeks: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          reviewed_by?: string | null
          starts_on?: string | null
          subtitle?: string | null
          title: string
          total_weeks?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          reviewed_by?: string | null
          starts_on?: string | null
          subtitle?: string | null
          title?: string
          total_weeks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_journeys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_journeys_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_journeys_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget_usd: number | null
          created_at: string
          created_by: string
          ends_on: string | null
          geography: string[]
          id: string
          landing_page_path: string
          name: string
          objective: string
          starts_on: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget_usd?: number | null
          created_at?: string
          created_by: string
          ends_on?: string | null
          geography?: string[]
          id?: string
          landing_page_path: string
          name: string
          objective: string
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget_usd?: number | null
          created_at?: string
          created_by?: string
          ends_on?: string | null
          geography?: string[]
          id?: string
          landing_page_path?: string
          name?: string
          objective?: string
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_flags: {
        Row: {
          active: boolean
          category: string
          child_id: string
          created_at: string
          created_by: string
          emergency: boolean
          id: string
          operational_instructions: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          summary: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          child_id: string
          created_at?: string
          created_by: string
          emergency?: boolean
          id?: string
          operational_instructions?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          child_id?: string
          created_at?: string
          created_by?: string
          emergency?: boolean
          id?: string
          operational_instructions?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_flags_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_flags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_flags_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          ended_at: string | null
          id: string
          joined_at: string
          membership_type: string
          muted_until: string | null
          profile_id: string
        }
        Insert: {
          channel_id: string
          ended_at?: string | null
          id?: string
          joined_at?: string
          membership_type?: string
          muted_until?: string | null
          profile_id: string
        }
        Update: {
          channel_id?: string
          ended_at?: string | null
          id?: string
          joined_at?: string
          membership_type?: string
          muted_until?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          group_id: string | null
          id: string
          kind: Database["public"]["Enums"]["channel_kind"]
          ministry_id: string | null
          name: string
          posting_policy: string
          slug: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["channel_kind"]
          ministry_id?: string | null
          name: string
          posting_policy?: string
          slug: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["channel_kind"]
          ministry_id?: string | null
          name?: string
          posting_policy?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_status_events: {
        Row: {
          child_id: string
          created_at: string
          external_reference: string | null
          id: string
          kids_class_id: string | null
          metadata: Json
          occurred_at: string
          recorded_by: string | null
          service_session_id: string
          source: string
          state: Database["public"]["Enums"]["checkin_state"]
        }
        Insert: {
          child_id: string
          created_at?: string
          external_reference?: string | null
          id?: string
          kids_class_id?: string | null
          metadata?: Json
          occurred_at: string
          recorded_by?: string | null
          service_session_id: string
          source?: string
          state: Database["public"]["Enums"]["checkin_state"]
        }
        Update: {
          child_id?: string
          created_at?: string
          external_reference?: string | null
          id?: string
          kids_class_id?: string | null
          metadata?: Json
          occurred_at?: string
          recorded_by?: string | null
          service_session_id?: string
          source?: string
          state?: Database["public"]["Enums"]["checkin_state"]
        }
        Relationships: [
          {
            foreignKeyName: "checkin_status_events_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_status_events_kids_class_id_fkey"
            columns: ["kids_class_id"]
            isOneToOne: false
            referencedRelation: "kids_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_status_events_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_status_events_service_session_id_fkey"
            columns: ["service_session_id"]
            isOneToOne: false
            referencedRelation: "service_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          active: boolean
          birth_date: string | null
          created_at: string
          created_by: string | null
          directory_visible: boolean
          household_id: string
          id: string
          legal_name: string | null
          preferred_name: string
          profile_photo_path: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          directory_visible?: boolean
          household_id: string
          id?: string
          legal_name?: string | null
          preferred_name: string
          profile_photo_path?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          directory_visible?: boolean
          household_id?: string
          id?: string
          legal_name?: string | null
          preferred_name?: string
          profile_photo_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "children_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      class_links: {
        Row: {
          assigned_by: string | null
          child_id: string
          ends_on: string | null
          id: string
          kids_class_id: string
          starts_on: string
        }
        Insert: {
          assigned_by?: string | null
          child_id: string
          ends_on?: string | null
          id?: string
          kids_class_id: string
          starts_on: string
        }
        Update: {
          assigned_by?: string | null
          child_id?: string
          ends_on?: string | null
          id?: string
          kids_class_id?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_links_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_links_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_links_kids_class_id_fkey"
            columns: ["kids_class_id"]
            isOneToOne: false
            referencedRelation: "kids_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          parent_comment_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          parent_comment_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_briefs: {
        Row: {
          approved_by: string | null
          approved_facts: Json
          campaign_id: string | null
          content_type: string
          created_at: string
          created_by: string
          draft_body: string | null
          id: string
          intended_audience: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["publication_status"]
          title: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_facts?: Json
          campaign_id?: string | null
          content_type: string
          created_at?: string
          created_by: string
          draft_body?: string | null
          id?: string
          intended_audience?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          title: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_facts?: Json
          campaign_id?: string | null
          content_type?: string
          created_at?: string
          created_by?: string
          draft_body?: string | null
          id?: string
          intended_audience?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_briefs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_briefs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_briefs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_briefs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          anonymous_session_id: string | null
          campaign_id: string | null
          event_name: string
          id: string
          occurred_at: string
          properties: Json
          source_path: string | null
          visit_request_id: string | null
        }
        Insert: {
          anonymous_session_id?: string | null
          campaign_id?: string | null
          event_name: string
          id?: string
          occurred_at?: string
          properties?: Json
          source_path?: string | null
          visit_request_id?: string | null
        }
        Update: {
          anonymous_session_id?: string | null
          campaign_id?: string | null
          event_name?: string
          id?: string
          occurred_at?: string
          properties?: Json
          source_path?: string | null
          visit_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_visit_request_id_fkey"
            columns: ["visit_request_id"]
            isOneToOne: false
            referencedRelation: "visit_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          id: string
          legal_hold: boolean
          request_scope: string
          requester_id: string | null
          status: string
          subject_household_id: string | null
          subject_profile_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          legal_hold?: boolean
          request_scope: string
          requester_id?: string | null
          status?: string
          subject_household_id?: string | null
          subject_profile_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          legal_hold?: boolean
          request_scope?: string
          requester_id?: string | null
          status?: string
          subject_household_id?: string | null
          subject_profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deletion_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deletion_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deletion_requests_subject_household_id_fkey"
            columns: ["subject_household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deletion_requests_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_receipts: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          notification_job_id: string
          occurred_at: string
          provider: string
          provider_message_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          notification_job_id: string
          occurred_at: string
          provider: string
          provider_message_id?: string | null
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          notification_job_id?: string
          occurred_at?: string
          provider?: string
          provider_message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_receipts_notification_job_id_fkey"
            columns: ["notification_job_id"]
            isOneToOne: false
            referencedRelation: "notification_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          approved_document_id: string
          content: string
          created_at: string
          embedding: string | null
          heading: string | null
          id: string
          position: number
          search_vector: unknown
          token_count: number | null
        }
        Insert: {
          approved_document_id: string
          content: string
          created_at?: string
          embedding?: string | null
          heading?: string | null
          id?: string
          position: number
          search_vector?: unknown
          token_count?: number | null
        }
        Update: {
          approved_document_id?: string
          content?: string
          created_at?: string
          embedding?: string | null
          heading?: string | null
          id?: string
          position?: number
          search_vector?: unknown
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_approved_document_id_fkey"
            columns: ["approved_document_id"]
            isOneToOne: false
            referencedRelation: "approved_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string
          household_id: string
          id: string
          phone: string
          priority: number
          relationship_label: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name: string
          household_id: string
          id?: string
          phone: string
          priority?: number
          relationship_label?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string
          household_id?: string
          id?: string
          phone?: string
          priority?: number
          relationship_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      event_occurrences: {
        Row: {
          cancellation_message: string | null
          created_at: string
          ends_at: string
          event_id: string
          id: string
          location_id: string | null
          starts_at: string
          updated_at: string
          virtual_url: string | null
        }
        Insert: {
          cancellation_message?: string | null
          created_at?: string
          ends_at: string
          event_id: string
          id?: string
          location_id?: string | null
          starts_at: string
          updated_at?: string
          virtual_url?: string | null
        }
        Update: {
          cancellation_message?: string | null
          created_at?: string
          ends_at?: string
          event_id?: string
          id?: string
          location_id?: string | null
          starts_at?: string
          updated_at?: string
          virtual_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_occurrences_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_occurrences_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_occurrences_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string
          created_by: string | null
          default_location_id: string | null
          description: string | null
          group_id: string | null
          id: string
          ministry_id: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          published_at: string | null
          published_by: string | null
          registration_required: boolean
          slug: string
          summary: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          default_location_id?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          ministry_id?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          registration_required?: boolean
          slug: string
          summary?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          default_location_id?: string | null
          description?: string | null
          group_id?: string | null
          id?: string
          ministry_id?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          registration_required?: boolean
          slug?: string
          summary?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_default_location_id_fkey"
            columns: ["default_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_checkin_refs: {
        Row: {
          child_id: string
          created_at: string
          external_checkin_id: string | null
          external_person_id: string | null
          id: string
          last_synced_at: string | null
          provider: string
          service_session_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          external_checkin_id?: string | null
          external_person_id?: string | null
          id?: string
          last_synced_at?: string | null
          provider: string
          service_session_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          external_checkin_id?: string | null
          external_person_id?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          service_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_checkin_refs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_checkin_refs_service_session_id_fkey"
            columns: ["service_session_id"]
            isOneToOne: false
            referencedRelation: "service_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      fellowship_meetup_members: {
        Row: {
          id: string
          joined_at: string
          meetup_id: string
          party_size: number
          profile_id: string
          status: string
          updated_at: string
        }
        Insert: {
          id?: string
          joined_at?: string
          meetup_id: string
          party_size?: number
          profile_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          id?: string
          joined_at?: string
          meetup_id?: string
          party_size?: number
          profile_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fellowship_meetup_members_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "fellowship_meetups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fellowship_meetup_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fellowship_meetup_messages: {
        Row: {
          author_profile_id: string
          body: string
          client_message_id: string | null
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          meetup_id: string
        }
        Insert: {
          author_profile_id: string
          body: string
          client_message_id?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          meetup_id: string
        }
        Update: {
          author_profile_id?: string
          body?: string
          client_message_id?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          meetup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fellowship_meetup_messages_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fellowship_meetup_messages_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: false
            referencedRelation: "fellowship_meetups"
            referencedColumns: ["id"]
          },
        ]
      }
      fellowship_meetup_private_details: {
        Row: {
          created_at: string
          exact_meeting_instructions: string | null
          host_contact_note: string | null
          meetup_id: string
          reveal_after_status: string
          updated_at: string
          updated_by: string | null
          virtual_join_url: string | null
        }
        Insert: {
          created_at?: string
          exact_meeting_instructions?: string | null
          host_contact_note?: string | null
          meetup_id: string
          reveal_after_status?: string
          updated_at?: string
          updated_by?: string | null
          virtual_join_url?: string | null
        }
        Update: {
          created_at?: string
          exact_meeting_instructions?: string | null
          host_contact_note?: string | null
          meetup_id?: string
          reveal_after_status?: string
          updated_at?: string
          updated_by?: string | null
          virtual_join_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fellowship_meetup_private_details_meetup_id_fkey"
            columns: ["meetup_id"]
            isOneToOne: true
            referencedRelation: "fellowship_meetups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fellowship_meetup_private_details_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fellowship_meetups: {
        Row: {
          allow_waitlist: boolean
          audience_label: string
          capacity: number | null
          category: string
          created_at: string
          creator_profile_id: string
          description: string
          ends_at: string
          family_friendly: boolean
          general_area: string
          general_location_name: string
          group_id: string | null
          guardian_required_for_minors: boolean
          id: string
          meeting_format: string
          ministry_id: string | null
          moderation_note: string | null
          spontaneous: boolean
          starts_at: string
          status: string
          timezone: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          allow_waitlist?: boolean
          audience_label?: string
          capacity?: number | null
          category: string
          created_at?: string
          creator_profile_id: string
          description: string
          ends_at: string
          family_friendly?: boolean
          general_area: string
          general_location_name: string
          group_id?: string | null
          guardian_required_for_minors?: boolean
          id?: string
          meeting_format?: string
          ministry_id?: string | null
          moderation_note?: string | null
          spontaneous?: boolean
          starts_at: string
          status?: string
          timezone?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          allow_waitlist?: boolean
          audience_label?: string
          capacity?: number | null
          category?: string
          created_at?: string
          creator_profile_id?: string
          description?: string
          ends_at?: string
          family_friendly?: boolean
          general_area?: string
          general_location_name?: string
          group_id?: string | null
          guardian_required_for_minors?: boolean
          id?: string
          meeting_format?: string
          ministry_id?: string | null
          moderation_note?: string | null
          spontaneous?: boolean
          starts_at?: string
          status?: string
          timezone?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "fellowship_meetups_creator_profile_id_fkey"
            columns: ["creator_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fellowship_meetups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fellowship_meetups_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      fellowship_preferences: {
        Row: {
          categories: string[]
          family_friendly_only: boolean
          general_areas: string[]
          low_pressure_preferred: boolean
          open_to_last_minute: boolean
          paused_until: string | null
          preferred_time_windows: string[]
          profile_id: string
          recommendations_enabled: boolean
          updated_at: string
        }
        Insert: {
          categories?: string[]
          family_friendly_only?: boolean
          general_areas?: string[]
          low_pressure_preferred?: boolean
          open_to_last_minute?: boolean
          paused_until?: string | null
          preferred_time_windows?: string[]
          profile_id: string
          recommendations_enabled?: boolean
          updated_at?: string
        }
        Update: {
          categories?: string[]
          family_friendly_only?: boolean
          general_areas?: string[]
          low_pressure_preferred?: boolean
          open_to_last_minute?: boolean
          paused_until?: string | null
          preferred_time_windows?: string[]
          profile_id?: string
          recommendations_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fellowship_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_constraints: {
        Row: {
          constraint_type: string
          created_at: string
          created_by: string
          cycle_id: string
          household_id: string | null
          id: string
          profile_id: string | null
          sensitivity: string
          target_group_id: string | null
          value: Json
        }
        Insert: {
          constraint_type: string
          created_at?: string
          created_by: string
          cycle_id: string
          household_id?: string | null
          id?: string
          profile_id?: string | null
          sensitivity?: string
          target_group_id?: string | null
          value?: Json
        }
        Update: {
          constraint_type?: string
          created_at?: string
          created_by?: string
          cycle_id?: string
          household_id?: string | null
          id?: string
          profile_id?: string | null
          sensitivity?: string
          target_group_id?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "group_constraints_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_constraints_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "group_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_constraints_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_constraints_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_constraints_target_group_id_fkey"
            columns: ["target_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_cycles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          configuration: Json
          created_at: string
          ends_on: string
          generated_by: string | null
          id: string
          kind: Database["public"]["Enums"]["group_kind"]
          name: string
          seed: string
          starts_on: string
          status: Database["public"]["Enums"]["group_cycle_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          configuration?: Json
          created_at?: string
          ends_on: string
          generated_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["group_kind"]
          name: string
          seed: string
          starts_on: string
          status?: Database["public"]["Enums"]["group_cycle_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          configuration?: Json
          created_at?: string
          ends_on?: string
          generated_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["group_kind"]
          name?: string
          seed?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["group_cycle_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_cycles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_cycles_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          ended_at: string | null
          group_id: string
          household_id: string | null
          id: string
          joined_at: string
          membership_type: string
          profile_id: string
        }
        Insert: {
          ended_at?: string | null
          group_id: string
          household_id?: string | null
          id?: string
          joined_at?: string
          membership_type?: string
          profile_id: string
        }
        Update: {
          ended_at?: string | null
          group_id?: string
          household_id?: string | null
          id?: string
          joined_at?: string
          membership_type?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          accessibility_supports: string[]
          created_at: string
          created_by: string | null
          description: string | null
          directory_visible: boolean
          general_city: string | null
          general_postal_prefix: string | null
          id: string
          kind: Database["public"]["Enums"]["group_kind"]
          maximum_members: number
          meeting_slots: string[]
          minimum_members: number
          ministry_id: string | null
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          accessibility_supports?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          directory_visible?: boolean
          general_city?: string | null
          general_postal_prefix?: string | null
          id?: string
          kind: Database["public"]["Enums"]["group_kind"]
          maximum_members?: number
          meeting_slots?: string[]
          minimum_members?: number
          ministry_id?: string | null
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          accessibility_supports?: string[]
          created_at?: string
          created_by?: string | null
          description?: string | null
          directory_visible?: boolean
          general_city?: string | null
          general_postal_prefix?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["group_kind"]
          maximum_members?: number
          meeting_slots?: string[]
          minimum_members?: number
          ministry_id?: string | null
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_links: {
        Row: {
          can_authorize_pickup: boolean
          can_check_in: boolean
          can_manage_profile: boolean
          child_id: string
          ends_at: string | null
          guardian_profile_id: string
          id: string
          legal_guardian: boolean
          relationship_label: string
          starts_at: string
          verified_by: string | null
        }
        Insert: {
          can_authorize_pickup?: boolean
          can_check_in?: boolean
          can_manage_profile?: boolean
          child_id: string
          ends_at?: string | null
          guardian_profile_id: string
          id?: string
          legal_guardian?: boolean
          relationship_label: string
          starts_at?: string
          verified_by?: string | null
        }
        Update: {
          can_authorize_pickup?: boolean
          can_check_in?: boolean
          can_manage_profile?: boolean
          child_id?: string
          ends_at?: string | null
          guardian_profile_id?: string
          id?: string
          legal_guardian?: boolean
          relationship_label?: string
          starts_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardian_links_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_links_guardian_profile_id_fkey"
            columns: ["guardian_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_links_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          can_manage_household: boolean
          ended_at: string | null
          household_id: string
          id: string
          is_primary_contact: boolean
          joined_at: string
          profile_id: string
          relationship_label: string | null
        }
        Insert: {
          can_manage_household?: boolean
          ended_at?: string | null
          household_id: string
          id?: string
          is_primary_contact?: boolean
          joined_at?: string
          profile_id: string
          relationship_label?: string | null
        }
        Update: {
          can_manage_household?: boolean
          ended_at?: string | null
          household_id?: string
          id?: string
          is_primary_contact?: boolean
          joined_at?: string
          profile_id?: string
          relationship_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          city: string | null
          created_at: string
          created_by: string | null
          directory_visible: boolean
          display_name: string
          id: string
          postal_code_prefix: string | null
          state_region: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          directory_visible?: boolean
          display_name: string
          id?: string
          postal_code_prefix?: string | null
          state_region?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          directory_visible?: boolean
          display_name?: string
          id?: string
          postal_code_prefix?: string | null
          state_region?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_prompt_drafts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content_brief_id: string | null
          created_at: string
          created_by: string
          generated_people_are_fictional: boolean
          id: string
          intended_use: string
          negative_prompt: string | null
          prompt: string
          status: string
          updated_at: string
          weekly_lesson_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content_brief_id?: string | null
          created_at?: string
          created_by: string
          generated_people_are_fictional?: boolean
          id?: string
          intended_use: string
          negative_prompt?: string | null
          prompt: string
          status?: string
          updated_at?: string
          weekly_lesson_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content_brief_id?: string | null
          created_at?: string
          created_by?: string
          generated_people_are_fictional?: boolean
          id?: string
          intended_use?: string
          negative_prompt?: string | null
          prompt?: string
          status?: string
          updated_at?: string
          weekly_lesson_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_prompt_drafts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_prompt_drafts_content_brief_id_fkey"
            columns: ["content_brief_id"]
            isOneToOne: false
            referencedRelation: "content_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_prompt_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_prompt_drafts_weekly_lesson_id_fkey"
            columns: ["weekly_lesson_id"]
            isOneToOne: false
            referencedRelation: "weekly_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          access_request_id: string | null
          consumed_at: string | null
          consumed_by: string | null
          created_at: string
          created_by: string
          expires_at: string
          id: string
          intended_email: string
          intended_household_id: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          roles_to_assign: string[]
          token_hash: string
        }
        Insert: {
          access_request_id?: string | null
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          intended_email: string
          intended_household_id?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          roles_to_assign?: string[]
          token_hash: string
        }
        Update: {
          access_request_id?: string | null
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          intended_email?: string
          intended_household_id?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          roles_to_assign?: string[]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "access_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_consumed_by_fkey"
            columns: ["consumed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_intended_household_id_fkey"
            columns: ["intended_household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_opportunities: {
        Row: {
          average_position: number | null
          clicks: number
          created_at: string
          existing_page_path: string | null
          id: string
          impressions: number
          locality: string
          opportunity_score: number
          query: string
          recommended_action: string
          reviewed_at: string | null
          reviewed_by: string | null
          snapshot_date: string
          source: string
        }
        Insert: {
          average_position?: number | null
          clicks?: number
          created_at?: string
          existing_page_path?: string | null
          id?: string
          impressions?: number
          locality?: string
          opportunity_score?: number
          query: string
          recommended_action: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot_date: string
          source?: string
        }
        Update: {
          average_position?: number | null
          clicks?: number
          created_at?: string
          existing_page_path?: string | null
          id?: string
          impressions?: number
          locality?: string
          opportunity_score?: number
          query?: string
          recommended_action?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          snapshot_date?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_opportunities_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_checkin_credentials: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          household_id: string
          id: string
          issued_by: string | null
          key_id: string
          revoked_at: string | null
          service_session_id: string
          token_hash: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          household_id: string
          id?: string
          issued_by?: string | null
          key_id: string
          revoked_at?: string | null
          service_session_id: string
          token_hash: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          household_id?: string
          id?: string
          issued_by?: string | null
          key_id?: string
          revoked_at?: string | null
          service_session_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_checkin_credentials_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_checkin_credentials_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_checkin_credentials_service_session_id_fkey"
            columns: ["service_session_id"]
            isOneToOne: false
            referencedRelation: "service_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_classes: {
        Row: {
          active: boolean
          age_band: string
          created_at: string
          external_reference: string | null
          id: string
          name: string
          room_label: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          age_band: string
          created_at?: string
          external_reference?: string | null
          id?: string
          name: string
          room_label?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          age_band?: string
          created_at?: string
          external_reference?: string | null
          id?: string
          name?: string
          room_label?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kids_kiosk_devices: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          device_key_hash: string
          id: string
          last_seen_at: string | null
          location_id: string | null
          name: string
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          device_key_hash: string
          id?: string
          last_seen_at?: string | null
          location_id?: string | null
          name: string
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          device_key_hash?: string
          id?: string
          last_seen_at?: string | null
          location_id?: string | null
          name?: string
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_kiosk_devices_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_kiosk_devices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_release_verifications: {
        Row: {
          child_id: string
          created_at: string
          id: string
          notes: string | null
          occurred_at: string
          provider: string
          provider_reference: string | null
          result: string
          service_session_id: string
          verification_method: string
          verified_by: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          provider: string
          provider_reference?: string | null
          result: string
          service_session_id: string
          verification_method: string
          verified_by: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          provider?: string
          provider_reference?: string | null
          result?: string
          service_session_id?: string
          verification_method?: string
          verified_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_release_verifications_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_release_verifications_service_session_id_fkey"
            columns: ["service_session_id"]
            isOneToOne: false
            referencedRelation: "service_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_release_verifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_volunteer_assignments: {
        Row: {
          approved_by: string
          created_at: string
          ends_at: string
          id: string
          kids_class_id: string
          profile_id: string
          role_label: string
          service_occurrence_id: string | null
          starts_at: string
        }
        Insert: {
          approved_by: string
          created_at?: string
          ends_at: string
          id?: string
          kids_class_id: string
          profile_id: string
          role_label: string
          service_occurrence_id?: string | null
          starts_at: string
        }
        Update: {
          approved_by?: string
          created_at?: string
          ends_at?: string
          id?: string
          kids_class_id?: string
          profile_id?: string
          role_label?: string
          service_occurrence_id?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kids_volunteer_assignments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_volunteer_assignments_kids_class_id_fkey"
            columns: ["kids_class_id"]
            isOneToOne: false
            referencedRelation: "kids_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_volunteer_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_volunteer_assignments_service_occurrence_id_fkey"
            columns: ["service_occurrence_id"]
            isOneToOne: false
            referencedRelation: "public_service_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_volunteer_assignments_service_occurrence_id_fkey"
            columns: ["service_occurrence_id"]
            isOneToOne: false
            referencedRelation: "service_occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      label_print_jobs: {
        Row: {
          attempts: number
          child_id: string
          created_at: string
          id: string
          kiosk_device_id: string | null
          last_error: string | null
          payload: Json
          payload_sha256: string
          printed_at: string | null
          printer_adapter: string
          service_session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          child_id: string
          created_at?: string
          id?: string
          kiosk_device_id?: string | null
          last_error?: string | null
          payload: Json
          payload_sha256: string
          printed_at?: string | null
          printer_adapter: string
          service_session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          child_id?: string
          created_at?: string
          id?: string
          kiosk_device_id?: string | null
          last_error?: string | null
          payload?: Json
          payload_sha256?: string
          printed_at?: string | null
          printer_adapter?: string
          service_session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "label_print_jobs_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_print_jobs_kiosk_device_id_fkey"
            columns: ["kiosk_device_id"]
            isOneToOne: false
            referencedRelation: "kids_kiosk_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_print_jobs_service_session_id_fkey"
            columns: ["service_session_id"]
            isOneToOne: false
            referencedRelation: "service_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      leader_assignments: {
        Row: {
          approved_by: string | null
          assignment_type: string
          ends_at: string | null
          id: string
          profile_id: string
          resource_id: string
          resource_type: string
          starts_at: string
        }
        Insert: {
          approved_by?: string | null
          assignment_type?: string
          ends_at?: string | null
          id?: string
          profile_id: string
          resource_id: string
          resource_type: string
          starts_at?: string
        }
        Update: {
          approved_by?: string | null
          assignment_type?: string
          ends_at?: string | null
          id?: string
          profile_id?: string
          resource_id?: string
          resource_type?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leader_assignments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leader_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_sections: {
        Row: {
          body: string
          created_at: string
          heading: string | null
          id: string
          lesson_id: string
          position: number
          section_type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          heading?: string | null
          id?: string
          lesson_id: string
          position?: number
          section_type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          heading?: string | null
          id?: string
          lesson_id?: string
          position?: number
          section_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "weekly_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      life_stages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          maximum_age: number | null
          minimum_age: number | null
          name: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          maximum_age?: number | null
          minimum_age?: number | null
          name: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          maximum_age?: number | null
          minimum_age?: number | null
          name?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          accessibility_notes: string | null
          address_line_1: string
          address_line_2: string | null
          city: string
          country_code: string
          created_at: string
          directions_url: string | null
          entrance_instructions: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          parking_instructions: string | null
          postal_code: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          slug: string
          state_region: string
          updated_at: string
        }
        Insert: {
          accessibility_notes?: string | null
          address_line_1: string
          address_line_2?: string | null
          city: string
          country_code?: string
          created_at?: string
          directions_url?: string | null
          entrance_instructions?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          parking_instructions?: string | null
          postal_code: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          slug: string
          state_region: string
          updated_at?: string
        }
        Update: {
          accessibility_notes?: string | null
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country_code?: string
          created_at?: string
          directions_url?: string | null
          entrance_instructions?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          parking_instructions?: string | null
          postal_code?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          slug?: string
          state_region?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_asset_subjects: {
        Row: {
          child_id: string
          confirmed_by: string | null
          created_at: string
          media_asset_id: string
        }
        Insert: {
          child_id: string
          confirmed_by?: string | null
          created_at?: string
          media_asset_id: string
        }
        Update: {
          child_id?: string
          confirmed_by?: string | null
          created_at?: string
          media_asset_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_asset_subjects_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_asset_subjects_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_asset_subjects_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          album_id: string
          approved_at: string | null
          approved_by: string | null
          approved_scope: Database["public"]["Enums"]["media_scope"] | null
          bytes: number
          created_at: string
          exif_removed: boolean
          id: string
          malware_scan_status: string
          media_type: string
          mime_type: string
          removed_at: string | null
          review_status: Database["public"]["Enums"]["media_review_status"]
          sha256: string
          storage_bucket: string
          storage_path: string
          uploader_id: string
        }
        Insert: {
          album_id: string
          approved_at?: string | null
          approved_by?: string | null
          approved_scope?: Database["public"]["Enums"]["media_scope"] | null
          bytes: number
          created_at?: string
          exif_removed?: boolean
          id?: string
          malware_scan_status?: string
          media_type: string
          mime_type: string
          removed_at?: string | null
          review_status?: Database["public"]["Enums"]["media_review_status"]
          sha256: string
          storage_bucket: string
          storage_path: string
          uploader_id: string
        }
        Update: {
          album_id?: string
          approved_at?: string | null
          approved_by?: string | null
          approved_scope?: Database["public"]["Enums"]["media_scope"] | null
          bytes?: number
          created_at?: string
          exif_removed?: boolean
          id?: string
          malware_scan_status?: string
          media_type?: string
          mime_type?: string
          removed_at?: string | null
          review_status?: Database["public"]["Enums"]["media_review_status"]
          sha256?: string
          storage_bucket?: string
          storage_path?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_assets_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_permissions: {
        Row: {
          child_id: string
          created_at: string
          effective_from: string
          effective_until: string | null
          granted: boolean
          granted_by_guardian: string
          id: string
          notes: string | null
          revoked_at: string | null
          scope: Database["public"]["Enums"]["media_scope"]
        }
        Insert: {
          child_id: string
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          granted: boolean
          granted_by_guardian: string
          id?: string
          notes?: string | null
          revoked_at?: string | null
          scope: Database["public"]["Enums"]["media_scope"]
        }
        Update: {
          child_id?: string
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          granted?: boolean
          granted_by_guardian?: string
          id?: string
          notes?: string | null
          revoked_at?: string | null
          scope?: Database["public"]["Enums"]["media_scope"]
        }
        Relationships: [
          {
            foreignKeyName: "media_permissions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_permissions_granted_by_guardian_fkey"
            columns: ["granted_by_guardian"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_reviews: {
        Row: {
          approved_scope: Database["public"]["Enums"]["media_scope"] | null
          created_at: string
          decision: Database["public"]["Enums"]["media_review_status"]
          id: string
          media_asset_id: string
          notes: string | null
          reviewer_id: string
        }
        Insert: {
          approved_scope?: Database["public"]["Enums"]["media_scope"] | null
          created_at?: string
          decision: Database["public"]["Enums"]["media_review_status"]
          id?: string
          media_asset_id: string
          notes?: string | null
          reviewer_id: string
        }
        Update: {
          approved_scope?: Database["public"]["Enums"]["media_scope"] | null
          created_at?: string
          decision?: Database["public"]["Enums"]["media_review_status"]
          id?: string
          media_asset_id?: string
          notes?: string | null
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_reviews_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string
          body: string
          channel_id: string
          client_id: string | null
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          reply_to_id: string | null
        }
        Insert: {
          author_id: string
          body: string
          channel_id: string
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          reply_to_id?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          channel_id?: string
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          reply_to_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ministries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          life_stage_id: string | null
          name: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          life_stage_id?: string | null
          name: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          life_stage_id?: string | null
          name?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministries_life_stage_id_fkey"
            columns: ["life_stage_id"]
            isOneToOne: false
            referencedRelation: "life_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_memberships: {
        Row: {
          ended_at: string | null
          id: string
          joined_at: string
          membership_type: string
          ministry_id: string
          profile_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          joined_at?: string
          membership_type?: string
          ministry_id: string
          profile_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          joined_at?: string
          membership_type?: string
          ministry_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministry_memberships_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministry_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action_type: string
          created_at: string
          ends_at: string | null
          id: string
          moderator_id: string
          reason: string
          report_id: string | null
          starts_at: string
          target_profile_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          ends_at?: string | null
          id?: string
          moderator_id: string
          reason: string
          report_id?: string | null
          starts_at?: string
          target_profile_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          moderator_id?: string
          reason?: string
          report_id?: string | null
          starts_at?: string
          target_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_jobs: {
        Row: {
          attempts: number
          audience_key: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          payload: Json
          profile_id: string | null
          scheduled_for: string
          sent_at: string | null
          source_event_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          template_key: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          audience_key?: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          payload?: Json
          profile_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          source_event_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          template_key: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          audience_key?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          payload?: Json
          profile_id?: string | null
          scheduled_for?: string
          sent_at?: string | null
          source_event_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          template_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          enabled: boolean
          id: string
          profile_id: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string
          topic: string
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"]
          enabled?: boolean
          id?: string
          profile_id: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          topic: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          enabled?: boolean
          id?: string
          profile_id?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outbox_events: {
        Row: {
          aggregate_id: string | null
          aggregate_type: string
          attempts: number
          available_at: string
          completed_at: string | null
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          payload: Json
          status: Database["public"]["Enums"]["job_status"]
        }
        Insert: {
          aggregate_id?: string | null
          aggregate_type: string
          attempts?: number
          available_at?: string
          completed_at?: string | null
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["job_status"]
        }
        Update: {
          aggregate_id?: string | null
          aggregate_type?: string
          attempts?: number
          available_at?: string
          completed_at?: string | null
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          payload?: Json
          status?: Database["public"]["Enums"]["job_status"]
        }
        Relationships: []
      }
      outreach_channel_attribution: {
        Row: {
          aggregate_conversions: number
          aggregate_visits: number
          channel_key: string
          channel_label: string
          created_at: string
          id: string
          snapshot_date: string
          source_system: string
        }
        Insert: {
          aggregate_conversions: number
          aggregate_visits: number
          channel_key: string
          channel_label: string
          created_at?: string
          id?: string
          snapshot_date: string
          source_system: string
        }
        Update: {
          aggregate_conversions?: number
          aggregate_visits?: number
          channel_key?: string
          channel_label?: string
          created_at?: string
          id?: string
          snapshot_date?: string
          source_system?: string
        }
        Relationships: []
      }
      outreach_funnel_snapshots: {
        Row: {
          aggregate_value: number
          created_at: string
          funnel_key: string
          id: string
          snapshot_date: string
          source_system: string
          stage_key: string
          stage_label: string
        }
        Insert: {
          aggregate_value: number
          created_at?: string
          funnel_key: string
          id?: string
          snapshot_date: string
          source_system: string
          stage_key: string
          stage_label: string
        }
        Update: {
          aggregate_value?: number
          created_at?: string
          funnel_key?: string
          id?: string
          snapshot_date?: string
          source_system?: string
          stage_key?: string
          stage_label?: string
        }
        Relationships: []
      }
      outreach_readiness_checks: {
        Row: {
          check_key: string
          created_at: string
          evidence: string | null
          evidence_url: string | null
          id: string
          label: string
          program: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          check_key: string
          created_at?: string
          evidence?: string | null
          evidence_url?: string | null
          id?: string
          label: string
          program: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          check_key?: string
          created_at?: string
          evidence?: string | null
          evidence_url?: string | null
          id?: string
          label?: string
          program?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_readiness_checks_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_source_connectors: {
        Row: {
          access_bypass_required: boolean
          accountable_owner_id: string | null
          allowed_hosts: string[]
          automatic_contact: boolean
          automatic_publishing: boolean
          automatic_reply: boolean
          base_url: string | null
          configuration: Json
          created_at: string
          display_name: string
          id: string
          key: string
          last_run_at: string | null
          last_run_status: string | null
          private_or_membership_only: boolean
          publicly_accessible: boolean
          purpose: string
          requires_login: boolean
          retention_days: number
          secret_reference: string | null
          source_kind: string
          status: string
          terms_reviewed_at: string | null
          terms_reviewed_by: string | null
          updated_at: string
        }
        Insert: {
          access_bypass_required?: boolean
          accountable_owner_id?: string | null
          allowed_hosts?: string[]
          automatic_contact?: boolean
          automatic_publishing?: boolean
          automatic_reply?: boolean
          base_url?: string | null
          configuration?: Json
          created_at?: string
          display_name: string
          id?: string
          key: string
          last_run_at?: string | null
          last_run_status?: string | null
          private_or_membership_only?: boolean
          publicly_accessible?: boolean
          purpose: string
          requires_login?: boolean
          retention_days?: number
          secret_reference?: string | null
          source_kind: string
          status?: string
          terms_reviewed_at?: string | null
          terms_reviewed_by?: string | null
          updated_at?: string
        }
        Update: {
          access_bypass_required?: boolean
          accountable_owner_id?: string | null
          allowed_hosts?: string[]
          automatic_contact?: boolean
          automatic_publishing?: boolean
          automatic_reply?: boolean
          base_url?: string | null
          configuration?: Json
          created_at?: string
          display_name?: string
          id?: string
          key?: string
          last_run_at?: string | null
          last_run_status?: string | null
          private_or_membership_only?: boolean
          publicly_accessible?: boolean
          purpose?: string
          requires_login?: boolean
          retention_days?: number
          secret_reference?: string | null
          source_kind?: string
          status?: string
          terms_reviewed_at?: string | null
          terms_reviewed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_source_connectors_accountable_owner_id_fkey"
            columns: ["accountable_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_source_connectors_terms_reviewed_by_fkey"
            columns: ["terms_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pairing_history: {
        Row: {
          created_at: string
          cycle_id: string
          group_id: string
          household_a_id: string
          household_b_id: string
          id: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          group_id: string
          household_a_id: string
          household_b_id: string
          id?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          group_id?: string
          household_a_id?: string
          household_b_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pairing_history_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "group_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairing_history_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairing_history_household_a_id_fkey"
            columns: ["household_a_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairing_history_household_b_id_fkey"
            columns: ["household_b_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_connections: {
        Row: {
          created_at: string
          id: string
          receiver_share_email: boolean
          receiver_share_phone: boolean
          receiving_guardian_id: string
          requester_share_email: boolean
          requester_share_phone: boolean
          requesting_guardian_id: string
          responded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_share_email?: boolean
          receiver_share_phone?: boolean
          receiving_guardian_id: string
          requester_share_email?: boolean
          requester_share_phone?: boolean
          requesting_guardian_id: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_share_email?: boolean
          receiver_share_phone?: boolean
          receiving_guardian_id?: string
          requester_share_email?: boolean
          requester_share_phone?: boolean
          requesting_guardian_id?: string
          responded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_connections_receiving_guardian_id_fkey"
            columns: ["receiving_guardian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_connections_requesting_guardian_id_fkey"
            columns: ["requesting_guardian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playdate_proposals: {
        Row: {
          created_at: string
          general_location: string
          id: string
          notes: string | null
          parent_connection_id: string
          proposed_by: string
          proposed_window_end: string
          proposed_window_start: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          general_location: string
          id?: string
          notes?: string | null
          parent_connection_id: string
          proposed_by: string
          proposed_window_end: string
          proposed_window_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          general_location?: string
          id?: string
          notes?: string | null
          parent_connection_id?: string
          proposed_by?: string
          proposed_window_end?: string
          proposed_window_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playdate_proposals_parent_connection_id_fkey"
            columns: ["parent_connection_id"]
            isOneToOne: false
            referencedRelation: "parent_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playdate_proposals_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          channel_id: string | null
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          pinned_until: string | null
          title: string | null
        }
        Insert: {
          author_id: string
          body: string
          channel_id?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          pinned_until?: string | null
          title?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          channel_id?: string | null
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          pinned_until?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          author_id: string
          body: string
          channel_id: string | null
          created_at: string
          follow_up_requested: boolean
          id: string
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id: string
          body: string
          channel_id?: string | null
          created_at?: string
          follow_up_requested?: boolean
          id?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string
          body?: string
          channel_id?: string | null
          created_at?: string
          follow_up_requested?: boolean
          id?: string
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_requests_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prayer_requests_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_community_guidelines_at: string | null
          accepted_privacy_at: string | null
          avatar_path: string | null
          created_at: string
          directory_visible: boolean
          display_name: string
          email: string
          id: string
          last_seen_at: string | null
          membership_status: Database["public"]["Enums"]["membership_status"]
          preferred_name: string | null
          updated_at: string
        }
        Insert: {
          accepted_community_guidelines_at?: string | null
          accepted_privacy_at?: string | null
          avatar_path?: string | null
          created_at?: string
          directory_visible?: boolean
          display_name: string
          email: string
          id: string
          last_seen_at?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          preferred_name?: string | null
          updated_at?: string
        }
        Update: {
          accepted_community_guidelines_at?: string | null
          accepted_privacy_at?: string | null
          avatar_path?: string | null
          created_at?: string
          directory_visible?: boolean
          display_name?: string
          email?: string
          id?: string
          last_seen_at?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          preferred_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      public_conversation_actions: {
        Row: {
          action_type: string
          approved_next_step_url: string | null
          created_at: string
          created_by: string
          disclosure_text: string | null
          draft_text: string | null
          id: string
          publish_automatically: boolean
          rationale: string | null
          requires_human_review: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          signal_id: string
          status: string
          updated_at: string
        }
        Insert: {
          action_type: string
          approved_next_step_url?: string | null
          created_at?: string
          created_by: string
          disclosure_text?: string | null
          draft_text?: string | null
          id?: string
          publish_automatically?: boolean
          rationale?: string | null
          requires_human_review?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          signal_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          approved_next_step_url?: string | null
          created_at?: string
          created_by?: string
          disclosure_text?: string | null
          draft_text?: string | null
          id?: string
          publish_automatically?: boolean
          rationale?: string | null
          requires_human_review?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          signal_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_conversation_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_conversation_actions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_conversation_actions_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "public_conversation_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      public_conversation_signals: {
        Row: {
          church_intent: number
          connector_id: string | null
          content_opportunity: number
          excerpt: string
          expires_at: string
          explicit_church_request: boolean
          family_relevance: number
          freshness: number
          id: string
          ingested_at: string
          local_relevance: number
          locality: string
          online_ministry_intent: number
          priority_score: number
          published_at: string | null
          recommendation: string | null
          reply_opportunity: number
          reviewed_at: string | null
          reviewed_by: string | null
          risk_sensitivity: number
          search_opportunity: number
          source_fingerprint: string
          source_kind: string
          source_label: string
          source_url: string
          status: string
          themes: string[]
          title: string
          updated_at: string
        }
        Insert: {
          church_intent: number
          connector_id?: string | null
          content_opportunity: number
          excerpt: string
          expires_at?: string
          explicit_church_request?: boolean
          family_relevance: number
          freshness: number
          id?: string
          ingested_at?: string
          local_relevance: number
          locality?: string
          online_ministry_intent: number
          priority_score: number
          published_at?: string | null
          recommendation?: string | null
          reply_opportunity: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_sensitivity: number
          search_opportunity: number
          source_fingerprint: string
          source_kind: string
          source_label: string
          source_url: string
          status?: string
          themes?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          church_intent?: number
          connector_id?: string | null
          content_opportunity?: number
          excerpt?: string
          expires_at?: string
          explicit_church_request?: boolean
          family_relevance?: number
          freshness?: number
          id?: string
          ingested_at?: string
          local_relevance?: number
          locality?: string
          online_ministry_intent?: number
          priority_score?: number
          published_at?: string | null
          recommendation?: string | null
          reply_opportunity?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_sensitivity?: number
          search_opportunity?: number
          source_fingerprint?: string
          source_kind?: string
          source_label?: string
          source_url?: string
          status?: string
          themes?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_conversation_signals_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "outreach_source_connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_conversation_signals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          device_label: string | null
          endpoint: string
          endpoint_hash: string
          expiration_time: string | null
          failure_count: number
          id: string
          last_failure_at: string | null
          last_success_at: string | null
          p256dh_key: string
          permission_status: string
          profile_id: string
          revoked_at: string | null
          updated_at: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          device_label?: string | null
          endpoint: string
          endpoint_hash: string
          expiration_time?: string | null
          failure_count?: number
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          p256dh_key: string
          permission_status?: string
          profile_id: string
          revoked_at?: string | null
          updated_at?: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          device_label?: string | null
          endpoint?: string
          endpoint_hash?: string
          expiration_time?: string | null
          failure_count?: number
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          p256dh_key?: string
          permission_status?: string
          profile_id?: string
          revoked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          reaction: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          reaction: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          reaction?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          event_occurrence_id: string
          household_id: string | null
          id: string
          notes: string | null
          party_size: number
          profile_id: string
          registered_at: string
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
        }
        Insert: {
          event_occurrence_id: string
          household_id?: string | null
          id?: string
          notes?: string | null
          party_size?: number
          profile_id: string
          registered_at?: string
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
        }
        Update: {
          event_occurrence_id?: string
          household_id?: string | null
          id?: string
          notes?: string | null
          party_size?: number
          profile_id?: string
          registered_at?: string
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_occurrence_id_fkey"
            columns: ["event_occurrence_id"]
            isOneToOne: false
            referencedRelation: "event_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_event_occurrence_id_fkey"
            columns: ["event_occurrence_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["occurrence_id"]
          },
          {
            foreignKeyName: "registrations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_signals: {
        Row: {
          approved_by: string
          content_free_attested: boolean
          created_at: string
          expires_at: string | null
          familiarity: number
          household_a_id: string
          household_b_id: string
          id: string
          observed_at: string
          source: string
        }
        Insert: {
          approved_by: string
          content_free_attested?: boolean
          created_at?: string
          expires_at?: string | null
          familiarity: number
          household_a_id: string
          household_b_id: string
          id?: string
          observed_at: string
          source: string
        }
        Update: {
          approved_by?: string
          content_free_attested?: boolean
          created_at?: string
          expires_at?: string | null
          familiarity?: number
          household_a_id?: string
          household_b_id?: string
          id?: string
          observed_at?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_signals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_signals_household_a_id_fkey"
            columns: ["household_a_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_signals_household_b_id_fkey"
            columns: ["household_b_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      release_gate_results: {
        Row: {
          created_at: string
          environment: string
          evidence_location: string | null
          gate_key: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          environment: string
          evidence_location?: string | null
          gate_key: string
          id?: string
          notes?: string | null
          status: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          environment?: string
          evidence_location?: string | null
          gate_key?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "release_gate_results_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          details: string | null
          id: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          details?: string | null
          id?: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          details?: string | null
          id?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lesson_id: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          resource_type: string
          storage_path: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lesson_id?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          resource_type: string
          storage_path?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lesson_id?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          resource_type?: string
          storage_path?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "weekly_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string | null
          id: string
          reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          role_id: string
          scope_id: string | null
          scope_type: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id: string
          scope_id?: string | null
          scope_type?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id?: string
          scope_id?: string | null
          scope_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string
          display_name: string
          id: string
          key: string
          privileged: boolean
        }
        Insert: {
          created_at?: string
          description: string
          display_name: string
          id?: string
          key: string
          privileged?: boolean
        }
        Update: {
          created_at?: string
          description?: string
          display_name?: string
          id?: string
          key?: string
          privileged?: boolean
        }
        Relationships: []
      }
      rotation_assignments: {
        Row: {
          adjusted_by: string | null
          created_at: string
          group_id: string
          household_id: string
          id: string
          manually_adjusted: boolean
          private_reasons: Json
          rotation_run_id: string
        }
        Insert: {
          adjusted_by?: string | null
          created_at?: string
          group_id: string
          household_id: string
          id?: string
          manually_adjusted?: boolean
          private_reasons?: Json
          rotation_run_id: string
        }
        Update: {
          adjusted_by?: string | null
          created_at?: string
          group_id?: string
          household_id?: string
          id?: string
          manually_adjusted?: boolean
          private_reasons?: Json
          rotation_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotation_assignments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_assignments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_assignments_rotation_run_id_fkey"
            columns: ["rotation_run_id"]
            isOneToOne: false
            referencedRelation: "rotation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      rotation_runs: {
        Row: {
          accepted_swaps: number
          algorithm_version: string
          approved_at: string | null
          approved_by: string | null
          completed_refinement_passes: number
          constraint_issues: Json
          content_free_signals_attested: boolean
          created_at: string
          cycle_id: string
          fingerprint: string | null
          generated_by: string
          id: string
          input_snapshot: Json
          optimization_strategy: string | null
          relationship_signal_count: number
          requested_refinement_passes: number
          score_breakdown: Json | null
          seed: string
          status: string
        }
        Insert: {
          accepted_swaps?: number
          algorithm_version: string
          approved_at?: string | null
          approved_by?: string | null
          completed_refinement_passes?: number
          constraint_issues?: Json
          content_free_signals_attested?: boolean
          created_at?: string
          cycle_id: string
          fingerprint?: string | null
          generated_by: string
          id?: string
          input_snapshot: Json
          optimization_strategy?: string | null
          relationship_signal_count?: number
          requested_refinement_passes?: number
          score_breakdown?: Json | null
          seed: string
          status: string
        }
        Update: {
          accepted_swaps?: number
          algorithm_version?: string
          approved_at?: string | null
          approved_by?: string | null
          completed_refinement_passes?: number
          constraint_issues?: Json
          content_free_signals_attested?: boolean
          created_at?: string
          cycle_id?: string
          fingerprint?: string | null
          generated_by?: string
          id?: string
          input_snapshot?: Json
          optimization_strategy?: string | null
          relationship_signal_count?: number
          requested_refinement_passes?: number
          score_breakdown?: Json | null
          seed?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rotation_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_runs_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "group_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rotation_runs_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safeguarding_reports: {
        Row: {
          closed_at: string | null
          escalated_at: string | null
          escalated_to: string | null
          external_report_reference: string | null
          id: string
          immediate_danger: boolean
          received_at: string
          reporter_id: string | null
          restricted_details: string | null
          status: Database["public"]["Enums"]["safeguarding_status"]
          summary: string
        }
        Insert: {
          closed_at?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          external_report_reference?: string | null
          id?: string
          immediate_danger?: boolean
          received_at?: string
          reporter_id?: string | null
          restricted_details?: string | null
          status?: Database["public"]["Enums"]["safeguarding_status"]
          summary: string
        }
        Update: {
          closed_at?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          external_report_reference?: string | null
          id?: string
          immediate_danger?: boolean
          received_at?: string
          reporter_id?: string | null
          restricted_details?: string | null
          status?: Database["public"]["Enums"]["safeguarding_status"]
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "safeguarding_reports_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safeguarding_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scripture_references: {
        Row: {
          context_label: string | null
          created_at: string
          id: string
          lesson_id: string | null
          position: number
          provider: string
          provider_resource_id: string | null
          reference: string
          series_id: string | null
          translation_id: string
        }
        Insert: {
          context_label?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          position?: number
          provider: string
          provider_resource_id?: string | null
          reference: string
          series_id?: string | null
          translation_id: string
        }
        Update: {
          context_label?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          position?: number
          provider?: string
          provider_resource_id?: string | null
          reference?: string
          series_id?: string | null
          translation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scripture_references_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "weekly_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scripture_references_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      search_performance_snapshots: {
        Row: {
          average_position: number | null
          click_through_rate: number | null
          clicks: number
          country_code: string | null
          created_at: string
          device: string | null
          id: string
          impressions: number
          page_path: string | null
          query: string | null
          snapshot_date: string
        }
        Insert: {
          average_position?: number | null
          click_through_rate?: number | null
          clicks?: number
          country_code?: string | null
          created_at?: string
          device?: string | null
          id?: string
          impressions?: number
          page_path?: string | null
          query?: string | null
          snapshot_date: string
        }
        Update: {
          average_position?: number | null
          click_through_rate?: number | null
          clicks?: number
          country_code?: string | null
          created_at?: string
          device?: string | null
          id?: string
          impressions?: number
          page_path?: string | null
          query?: string | null
          snapshot_date?: string
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          contained_at: string | null
          created_at: string
          detected_at: string
          id: string
          incident_lead: string | null
          reported_by: string | null
          resolved_at: string | null
          sensitive_details: string | null
          severity: string
          status: Database["public"]["Enums"]["incident_status"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          contained_at?: string | null
          created_at?: string
          detected_at: string
          id?: string
          incident_lead?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          sensitive_details?: string | null
          severity: string
          status?: Database["public"]["Enums"]["incident_status"]
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          contained_at?: string | null
          created_at?: string
          detected_at?: string
          id?: string
          incident_lead?: string | null
          reported_by?: string | null
          resolved_at?: string | null
          sensitive_details?: string | null
          severity?: string
          status?: Database["public"]["Enums"]["incident_status"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_incidents_incident_lead_fkey"
            columns: ["incident_lead"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          created_at: string
          created_by: string | null
          ends_on: string | null
          hero_image_path: string | null
          id: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          published_at: string | null
          published_by: string | null
          slug: string
          starts_on: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          hero_image_path?: string | null
          id?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          slug: string
          starts_on?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_on?: string | null
          hero_image_path?: string | null
          id?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          slug?: string
          starts_on?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "series_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sermon_curriculum_drafts: {
        Row: {
          ai_request_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          curriculum: Json
          generated_by: string | null
          id: string
          reviewed_by: string | null
          source_document_ids: string[]
          status: string
          updated_at: string
          weekly_lesson_id: string
        }
        Insert: {
          ai_request_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          curriculum?: Json
          generated_by?: string | null
          id?: string
          reviewed_by?: string | null
          source_document_ids?: string[]
          status?: string
          updated_at?: string
          weekly_lesson_id: string
        }
        Update: {
          ai_request_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          curriculum?: Json
          generated_by?: string | null
          id?: string
          reviewed_by?: string | null
          source_document_ids?: string[]
          status?: string
          updated_at?: string
          weekly_lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sermon_curriculum_drafts_ai_request_id_fkey"
            columns: ["ai_request_id"]
            isOneToOne: false
            referencedRelation: "ai_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_curriculum_drafts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_curriculum_drafts_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_curriculum_drafts_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermon_curriculum_drafts_weekly_lesson_id_fkey"
            columns: ["weekly_lesson_id"]
            isOneToOne: false
            referencedRelation: "weekly_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      service_occurrences: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          location_id: string
          occurrence_type: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          service_template_id: string | null
          starts_at: string
          status_message: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          location_id: string
          occurrence_type?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          service_template_id?: string | null
          starts_at: string
          status_message?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          location_id?: string
          occurrence_type?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          service_template_id?: string | null
          starts_at?: string
          status_message?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_occurrences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_occurrences_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_occurrences_service_template_id_fkey"
            columns: ["service_template_id"]
            isOneToOne: false
            referencedRelation: "service_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      service_overrides: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          occurrence_date: string
          override_type: string
          public_message: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          replacement_occurrence_id: string | null
          service_template_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          occurrence_date: string
          override_type: string
          public_message: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          replacement_occurrence_id?: string | null
          service_template_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          occurrence_date?: string
          override_type?: string
          public_message?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          replacement_occurrence_id?: string | null
          service_template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_overrides_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_overrides_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_overrides_replacement_occurrence_id_fkey"
            columns: ["replacement_occurrence_id"]
            isOneToOne: false
            referencedRelation: "public_service_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_overrides_replacement_occurrence_id_fkey"
            columns: ["replacement_occurrence_id"]
            isOneToOne: false
            referencedRelation: "service_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_overrides_service_template_id_fkey"
            columns: ["service_template_id"]
            isOneToOne: false
            referencedRelation: "service_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      service_sessions: {
        Row: {
          checkin_system: string
          closes_at: string
          created_at: string
          external_reference: string | null
          id: string
          opens_at: string
          service_occurrence_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          checkin_system?: string
          closes_at: string
          created_at?: string
          external_reference?: string | null
          id?: string
          opens_at: string
          service_occurrence_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          checkin_system?: string
          closes_at?: string
          created_at?: string
          external_reference?: string | null
          id?: string
          opens_at?: string
          service_occurrence_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_sessions_service_occurrence_id_fkey"
            columns: ["service_occurrence_id"]
            isOneToOne: false
            referencedRelation: "public_service_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_sessions_service_occurrence_id_fkey"
            columns: ["service_occurrence_id"]
            isOneToOne: false
            referencedRelation: "service_occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      service_templates: {
        Row: {
          created_at: string
          created_by: string | null
          day_of_week: number
          duration_minutes: number
          effective_from: string
          effective_until: string | null
          id: string
          local_start_time: string
          location_id: string
          name: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          recurrence_rule: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_of_week: number
          duration_minutes?: number
          effective_from: string
          effective_until?: string | null
          id?: string
          local_start_time: string
          location_id: string
          name: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          recurrence_rule?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          duration_minutes?: number
          effective_from?: string
          effective_until?: string | null
          id?: string
          local_start_time?: string
          location_id?: string
          name?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          recurrence_rule?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_templates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_drafts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          content_brief_id: string | null
          created_at: string
          created_by: string
          external_post_id: string | null
          id: string
          media_asset_id: string | null
          platform: string
          published_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["social_draft_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          content_brief_id?: string | null
          created_at?: string
          created_by: string
          external_post_id?: string | null
          id?: string
          media_asset_id?: string | null
          platform: string
          published_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["social_draft_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          content_brief_id?: string | null
          created_at?: string
          created_by?: string
          external_post_id?: string | null
          id?: string
          media_asset_id?: string | null
          platform?: string
          published_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["social_draft_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_drafts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_drafts_content_brief_id_fkey"
            columns: ["content_brief_id"]
            isOneToOne: false
            referencedRelation: "content_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_drafts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_drafts_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      takedown_requests: {
        Row: {
          created_at: string
          id: string
          media_asset_id: string
          reason: string
          requester_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          media_asset_id: string
          reason: string
          requester_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          id?: string
          media_asset_id?: string
          reason?: string
          requester_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "takedown_requests_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takedown_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takedown_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          assurance_level: string | null
          auth_session_id: string | null
          ended_at: string | null
          id: string
          ip_hash: string | null
          last_seen_at: string
          started_at: string
          user_agent_hash: string | null
          user_id: string
        }
        Insert: {
          assurance_level?: string | null
          auth_session_id?: string | null
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          started_at?: string
          user_agent_hash?: string | null
          user_id: string
        }
        Update: {
          assurance_level?: string | null
          auth_session_id?: string | null
          ended_at?: string | null
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          started_at?: string
          user_agent_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_accounts: {
        Row: {
          account_owner: string
          created_at: string
          id: string
          last_access_review_at: string | null
          primary_recovery_owner: string
          purpose: string
          secondary_recovery_owner: string
          secret_location_reference: string | null
          updated_at: string
          vendor_name: string
        }
        Insert: {
          account_owner: string
          created_at?: string
          id?: string
          last_access_review_at?: string | null
          primary_recovery_owner: string
          purpose: string
          secondary_recovery_owner: string
          secret_location_reference?: string | null
          updated_at?: string
          vendor_name: string
        }
        Update: {
          account_owner?: string
          created_at?: string
          id?: string
          last_access_review_at?: string | null
          primary_recovery_owner?: string
          purpose?: string
          secondary_recovery_owner?: string
          secret_location_reference?: string | null
          updated_at?: string
          vendor_name?: string
        }
        Relationships: []
      }
      visit_requests: {
        Row: {
          assigned_to: string | null
          children_attending: boolean
          consent_to_contact: boolean
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string | null
          message: string | null
          party_size: number
          phone: string | null
          requested_next_step: string | null
          source_campaign: string | null
          source_ip_hash: string | null
          source_path: string | null
          status: string
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          assigned_to?: string | null
          children_attending?: boolean
          consent_to_contact: boolean
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name?: string | null
          message?: string | null
          party_size?: number
          phone?: string | null
          requested_next_step?: string | null
          source_campaign?: string | null
          source_ip_hash?: string | null
          source_path?: string | null
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          assigned_to?: string | null
          children_attending?: boolean
          consent_to_contact?: boolean
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string | null
          message?: string | null
          party_size?: number
          phone?: string | null
          requested_next_step?: string | null
          source_campaign?: string | null
          source_ip_hash?: string | null
          source_path?: string | null
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          event_occurrence_id: string
          id: string
          profile_id: string
          role_label: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          event_occurrence_id: string
          id?: string
          profile_id: string
          role_label: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          event_occurrence_id?: string
          id?: string
          profile_id?: string
          role_label?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_event_occurrence_id_fkey"
            columns: ["event_occurrence_id"]
            isOneToOne: false
            referencedRelation: "event_occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_event_occurrence_id_fkey"
            columns: ["event_occurrence_id"]
            isOneToOne: false
            referencedRelation: "public_events"
            referencedColumns: ["occurrence_id"]
          },
          {
            foreignKeyName: "volunteer_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_receipts: {
        Row: {
          event_type: string | null
          external_event_id: string
          id: string
          payload_hash: string
          processed_at: string | null
          processing_error: string | null
          provider: string
          received_at: string
          signature_valid: boolean
        }
        Insert: {
          event_type?: string | null
          external_event_id: string
          id?: string
          payload_hash: string
          processed_at?: string | null
          processing_error?: string | null
          provider: string
          received_at?: string
          signature_valid: boolean
        }
        Update: {
          event_type?: string | null
          external_event_id?: string
          id?: string
          payload_hash?: string
          processed_at?: string | null
          processing_error?: string | null
          provider?: string
          received_at?: string
          signature_valid?: boolean
        }
        Relationships: []
      }
      weekly_lessons: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          minister_announcement: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          scripture_of_week_reference: string | null
          series_id: string | null
          sermon_audio_url: string | null
          sermon_video_url: string | null
          service_occurrence_id: string | null
          slug: string
          summary: string | null
          title: string
          transcript: string | null
          updated_at: string
          week_of: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          minister_announcement?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          reviewed_by?: string | null
          scripture_of_week_reference?: string | null
          series_id?: string | null
          sermon_audio_url?: string | null
          sermon_video_url?: string | null
          service_occurrence_id?: string | null
          slug: string
          summary?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
          week_of: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          minister_announcement?: string | null
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          published_by?: string | null
          reviewed_by?: string | null
          scripture_of_week_reference?: string | null
          series_id?: string | null
          sermon_audio_url?: string | null
          sermon_video_url?: string | null
          service_occurrence_id?: string | null
          slug?: string
          summary?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
          week_of?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_lessons_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_lessons_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_lessons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_lessons_service_occurrence_id_fkey"
            columns: ["service_occurrence_id"]
            isOneToOne: false
            referencedRelation: "public_service_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_lessons_service_occurrence_id_fkey"
            columns: ["service_occurrence_id"]
            isOneToOne: false
            referencedRelation: "service_occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_events: {
        Row: {
          capacity: number | null
          city: string | null
          description: string | null
          ends_at: string | null
          id: string | null
          location_name: string | null
          occurrence_id: string | null
          postal_code: string | null
          registration_required: boolean | null
          slug: string | null
          starts_at: string | null
          state_region: string | null
          summary: string | null
          title: string | null
        }
        Relationships: []
      }
      public_service_schedule: {
        Row: {
          accessibility_notes: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          directions_url: string | null
          ends_at: string | null
          entrance_instructions: string | null
          id: string | null
          location_name: string | null
          location_slug: string | null
          occurrence_type: string | null
          parking_instructions: string | null
          postal_code: string | null
          starts_at: string | null
          state_region: string | null
          status_message: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_album: {
        Args: { requested_album_id: string; target_user?: string }
        Returns: boolean
      }
      can_access_fellowship_thread: {
        Args: { requested_meetup_id: string; target_user?: string }
        Returns: boolean
      }
      can_access_media_storage_path: {
        Args: {
          requested_bucket: string
          requested_path: string
          target_user?: string
        }
        Returns: boolean
      }
      can_access_realtime_topic: {
        Args: { requested_topic: string; target_user?: string }
        Returns: boolean
      }
      can_assign_role_key: {
        Args: { requested_role: string }
        Returns: boolean
      }
      can_assign_role_keys: {
        Args: { requested_roles: string[] }
        Returns: boolean
      }
      can_manage_child: {
        Args: { requested_child_id: string; target_user?: string }
        Returns: boolean
      }
      can_manage_household: {
        Args: { requested_household_id: string; target_user?: string }
        Returns: boolean
      }
      can_manage_publication_state: {
        Args: {
          requested_status: Database["public"]["Enums"]["publication_status"]
        }
        Returns: boolean
      }
      can_post_channel: {
        Args: { requested_channel_id: string; target_user?: string }
        Returns: boolean
      }
      can_view_fellowship_meetup: {
        Args: { requested_meetup_id: string; target_user?: string }
        Returns: boolean
      }
      claim_notification_jobs: {
        Args: {
          requested_channel: Database["public"]["Enums"]["notification_channel"]
          requested_limit: number
          worker_id: string
        }
        Returns: {
          attempts: number
          id: string
          payload: Json
          profile_id: string
          template_key: string
        }[]
      }
      claim_outbox_events: {
        Args: {
          requested_event_types: string[]
          requested_limit: number
          worker_id: string
        }
        Returns: {
          attempts: number
          event_type: string
          id: string
          payload: Json
        }[]
      }
      complete_notification_job: {
        Args: {
          provider_message_id?: string
          provider_name: string
          requested_id: string
        }
        Returns: undefined
      }
      complete_outbox_event: {
        Args: { requested_id: string }
        Returns: undefined
      }
      consume_invitation: {
        Args: {
          p_accept_community_guidelines: boolean
          p_accept_privacy: boolean
          p_token_hash: string
        }
        Returns: Json
      }
      create_invitation: {
        Args: {
          p_access_request_id?: string
          p_expires_at: string
          p_household_id?: string
          p_intended_email: string
          p_roles?: string[]
          p_token_hash: string
        }
        Returns: string
      }
      enqueue_outbox_event: {
        Args: {
          p_aggregate_id: string
          p_aggregate_type: string
          p_available_at?: string
          p_event_type: string
          p_payload: Json
        }
        Returns: string
      }
      fail_notification_job: {
        Args: {
          failure_message: string
          permanent_failure?: boolean
          requested_id: string
        }
        Returns: undefined
      }
      fail_outbox_event: {
        Args: { failure_message: string; requested_id: string }
        Returns: undefined
      }
      fellowship_meetup_attendee_count: {
        Args: { requested_meetup_id: string }
        Returns: number
      }
      get_assigned_kids_roster: {
        Args: { p_at?: string; p_class_id: string }
        Returns: {
          care_summary: Json
          child_id: string
          current_state: Database["public"]["Enums"]["checkin_state"]
          preferred_name: string
        }[]
      }
      get_current_public_schedule: {
        Args: { p_after?: string }
        Returns: {
          accessibility_notes: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          directions_url: string | null
          ends_at: string | null
          entrance_instructions: string | null
          id: string | null
          location_name: string | null
          location_slug: string | null
          occurrence_type: string | null
          parking_instructions: string | null
          postal_code: string | null
          starts_at: string | null
          state_region: string | null
          status_message: string | null
          title: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "public_service_schedule"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_child_release_history: {
        Args: { requested_child_id: string; requested_limit?: number }
        Returns: {
          id: string
          occurred_at: string
          provider: string
          result: string
          service_session_id: string
          verification_method: string
        }[]
      }
      get_my_this_week: { Args: { p_reference_date?: string }; Returns: Json }
      has_any_role: {
        Args: { requested_roles: string[]; target_user?: string }
        Returns: boolean
      }
      has_outreach_mfa_role: {
        Args: { allowed_role_keys: string[]; target_user?: string }
        Returns: boolean
      }
      has_role: {
        Args: { requested_role: string; target_user?: string }
        Returns: boolean
      }
      is_aal2: { Args: never; Returns: boolean }
      is_active_member: { Args: { target_user?: string }; Returns: boolean }
      is_assigned_kids_volunteer: {
        Args: {
          requested_class_id: string
          requested_time?: string
          target_user?: string
        }
        Returns: boolean
      }
      is_channel_member: {
        Args: { requested_channel_id: string; target_user?: string }
        Returns: boolean
      }
      is_fellowship_participant: {
        Args: { requested_meetup_id: string; target_user?: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { requested_group_id: string; target_user?: string }
        Returns: boolean
      }
      is_guardian_of_child: {
        Args: { requested_child_id: string; target_user?: string }
        Returns: boolean
      }
      is_household_member: {
        Args: { requested_household_id: string; target_user?: string }
        Returns: boolean
      }
      is_ministry_member: {
        Args: { requested_ministry_id: string; target_user?: string }
        Returns: boolean
      }
      is_privileged_actor: {
        Args: { requested_roles: string[] }
        Returns: boolean
      }
      leads_group: {
        Args: { requested_group_id: string; target_user?: string }
        Returns: boolean
      }
      may_check_target_user: { Args: { target_user: string }; Returns: boolean }
      publish_weekly_lesson: {
        Args: { p_lesson_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          id: string
          minister_announcement: string | null
          publication_status: Database["public"]["Enums"]["publication_status"]
          published_at: string | null
          published_by: string | null
          reviewed_by: string | null
          scripture_of_week_reference: string | null
          series_id: string | null
          sermon_audio_url: string | null
          sermon_video_url: string | null
          service_occurrence_id: string | null
          slug: string
          summary: string | null
          title: string
          transcript: string | null
          updated_at: string
          week_of: string
        }
        SetofOptions: {
          from: "*"
          to: "weekly_lessons"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      record_public_conversion_event: {
        Args: {
          p_anonymous_session_id: string
          p_event_name: string
          p_properties?: Json
          p_source_path: string
        }
        Returns: string
      }
      submit_access_request: {
        Args: {
          p_email: string
          p_first_name: string
          p_ip_hash?: string
          p_known_leader: string
          p_last_name: string
          p_phone: string
          p_reason: string
          p_relationship: string
          p_user_agent_hash?: string
        }
        Returns: string
      }
      submit_visit_request: {
        Args: {
          p_children_attending: boolean
          p_consent_to_contact: boolean
          p_email: string
          p_first_name: string
          p_ip_hash?: string
          p_last_name: string
          p_message: string
          p_party_size: number
          p_phone: string
          p_requested_next_step: string
          p_source_campaign?: string
          p_source_path: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: string
      }
      write_audit_event: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
    }
    Enums: {
      access_request_status:
        | "pending"
        | "verifying"
        | "approved"
        | "declined"
        | "withdrawn"
      ai_request_status:
        | "queued"
        | "processing"
        | "draft_ready"
        | "reviewed"
        | "rejected"
        | "failed"
      channel_kind:
        | "announcement"
        | "discussion"
        | "prayer"
        | "group"
        | "ministry"
        | "parents"
        | "teens"
      checkin_state:
        | "prechecked"
        | "checked_in"
        | "moved"
        | "pickup_requested"
        | "checked_out"
        | "cancelled"
      event_visibility: "public" | "members" | "group" | "ministry" | "leaders"
      group_cycle_status:
        | "draft"
        | "proposed"
        | "approved"
        | "active"
        | "closed"
      group_kind:
        | "family_group"
        | "ministry"
        | "icebreaker"
        | "parents"
        | "teens"
        | "service_team"
      incident_status:
        | "open"
        | "contained"
        | "investigating"
        | "resolved"
        | "closed"
      job_status: "pending" | "processing" | "sent" | "failed" | "cancelled"
      media_review_status:
        | "pending_scan"
        | "pending_consent"
        | "pending_review"
        | "approved"
        | "rejected"
        | "removed"
      media_scope:
        | "private_household"
        | "private_class"
        | "private_parent_community"
        | "internal_presentation"
        | "public_website"
        | "official_social"
        | "promotional_advertising"
      membership_status: "pending" | "active" | "suspended" | "departed"
      notification_channel: "email" | "web_push" | "in_app"
      publication_status:
        | "draft"
        | "in_review"
        | "scheduled"
        | "published"
        | "archived"
      registration_status:
        | "registered"
        | "waitlisted"
        | "cancelled"
        | "attended"
        | "no_show"
      report_status:
        | "open"
        | "triaged"
        | "investigating"
        | "resolved"
        | "dismissed"
      safeguarding_status:
        | "received"
        | "escalated"
        | "external_report_required"
        | "closed"
      social_draft_status:
        | "draft"
        | "in_review"
        | "approved"
        | "scheduled"
        | "published"
        | "rejected"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_request_status: [
        "pending",
        "verifying",
        "approved",
        "declined",
        "withdrawn",
      ],
      ai_request_status: [
        "queued",
        "processing",
        "draft_ready",
        "reviewed",
        "rejected",
        "failed",
      ],
      channel_kind: [
        "announcement",
        "discussion",
        "prayer",
        "group",
        "ministry",
        "parents",
        "teens",
      ],
      checkin_state: [
        "prechecked",
        "checked_in",
        "moved",
        "pickup_requested",
        "checked_out",
        "cancelled",
      ],
      event_visibility: ["public", "members", "group", "ministry", "leaders"],
      group_cycle_status: ["draft", "proposed", "approved", "active", "closed"],
      group_kind: [
        "family_group",
        "ministry",
        "icebreaker",
        "parents",
        "teens",
        "service_team",
      ],
      incident_status: [
        "open",
        "contained",
        "investigating",
        "resolved",
        "closed",
      ],
      job_status: ["pending", "processing", "sent", "failed", "cancelled"],
      media_review_status: [
        "pending_scan",
        "pending_consent",
        "pending_review",
        "approved",
        "rejected",
        "removed",
      ],
      media_scope: [
        "private_household",
        "private_class",
        "private_parent_community",
        "internal_presentation",
        "public_website",
        "official_social",
        "promotional_advertising",
      ],
      membership_status: ["pending", "active", "suspended", "departed"],
      notification_channel: ["email", "web_push", "in_app"],
      publication_status: [
        "draft",
        "in_review",
        "scheduled",
        "published",
        "archived",
      ],
      registration_status: [
        "registered",
        "waitlisted",
        "cancelled",
        "attended",
        "no_show",
      ],
      report_status: [
        "open",
        "triaged",
        "investigating",
        "resolved",
        "dismissed",
      ],
      safeguarding_status: [
        "received",
        "escalated",
        "external_report_required",
        "closed",
      ],
      social_draft_status: [
        "draft",
        "in_review",
        "approved",
        "scheduled",
        "published",
        "rejected",
      ],
    },
  },
} as const

