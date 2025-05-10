export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      sightings: {
        Row: {
          id: string
          date: string
          min_group_size: number
          first_sighting_location: string | null
          first_sighting_latitude: number | null
          first_sighting_longitude: number | null
          first_sighting_time: string | null
          first_sighting_direction: string | null
          end_sighting_location: string | null
          end_sighting_latitude: number | null
          end_sighting_longitude: number | null
          end_sighting_time: string | null
          end_sighting_direction: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          min_group_size: number
          first_sighting_location?: string | null
          first_sighting_latitude?: number | null
          first_sighting_longitude?: number | null
          first_sighting_time?: string | null
          first_sighting_direction?: string | null
          end_sighting_location?: string | null
          end_sighting_latitude?: number | null
          end_sighting_longitude?: number | null
          end_sighting_time?: string | null
          end_sighting_direction?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          min_group_size?: number
          first_sighting_location?: string | null
          first_sighting_latitude?: number | null
          first_sighting_longitude?: number | null
          first_sighting_time?: string | null
          first_sighting_direction?: string | null
          end_sighting_location?: string | null
          end_sighting_latitude?: number | null
          end_sighting_longitude?: number | null
          end_sighting_time?: string | null
          end_sighting_direction?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      whales: {
        Row: {
          id: string
          matriline_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          matriline_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          matriline_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      sighting_whales: {
        Row: {
          id: string
          sighting_id: string
          whale_id: string
          created_at: string
        }
        Insert: {
          id?: string
          sighting_id: string
          whale_id: string
          created_at?: string
        }
        Update: {
          id?: string
          sighting_id?: string
          whale_id?: string
          created_at?: string
        }
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
  }
} 