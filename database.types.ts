export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    avatar_url: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            tasks: {
                Row: {
                    color: string | null
                    created_at: string | null
                    date: string | null
                    id: string
                    status: string | null
                    time: string | null
                    title: string
                    type: string
                    urgency: string | null
                    user_id: string | null
                }
                Insert: {
                    color?: string | null
                    created_at?: string | null
                    date?: string | null
                    id?: string
                    status?: string | null
                    time?: string | null
                    title: string
                    type: string
                    urgency?: string | null
                    user_id?: string | null
                }
                Update: {
                    color?: string | null
                    created_at?: string | null
                    date?: string | null
                    id?: string
                    status?: string | null
                    time?: string | null
                    title?: string
                    type?: string
                    urgency?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            time_blocks: {
                Row: {
                    color: string | null
                    created_at: string | null
                    days: string[] | null
                    end_time: string | null
                    icon: string | null
                    id: string
                    name: string
                    start_time: string | null
                    user_id: string | null
                }
                Insert: {
                    color?: string | null
                    created_at?: string | null
                    days?: string[] | null
                    end_time?: string | null
                    icon?: string | null
                    id?: string
                    name: string
                    start_time?: string | null
                    user_id?: string | null
                }
                Update: {
                    color?: string | null
                    created_at?: string | null
                    days?: string[] | null
                    end_time?: string | null
                    icon?: string | null
                    id?: string
                    name?: string
                    start_time?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            whiteboard_notes: {
                Row: {
                    color: string | null
                    content: string | null
                    created_at: string | null
                    font_size: number | null
                    height: number
                    id: string
                    image_url: string | null
                    rotation: number | null
                    title: string | null
                    type: string | null
                    user_id: string | null
                    width: number
                    x: number
                    y: number
                    z_index: number | null
                }
                Insert: {
                    color?: string | null
                    content?: string | null
                    created_at?: string | null
                    font_size?: number | null
                    height: number
                    id?: string
                    image_url?: string | null
                    rotation?: number | null
                    title?: string | null
                    type?: string | null
                    user_id?: string | null
                    width: number
                    x: number
                    y: number
                    z_index?: number | null
                }
                Update: {
                    color?: string | null
                    content?: string | null
                    created_at?: string | null
                    font_size?: number | null
                    height?: number
                    id?: string
                    image_url?: string | null
                    rotation?: number | null
                    title?: string | null
                    type?: string | null
                    user_id?: string | null
                    width?: number
                    x?: number
                    y?: number
                    z_index?: number | null
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

type PublicSchema = Database["public"]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: "public" },
    TableName extends PublicTableNameOrOptions extends { schema: "public" }
    ? keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: "public" }
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[TableName] extends {
        Row: infer R
    }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
    }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: "public" },
    TableName extends PublicTableNameOrOptions extends { schema: "public" }
    ? keyof PublicSchema["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: "public" }
    ? PublicSchema["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: "public" },
    TableName extends PublicTableNameOrOptions extends { schema: "public" }
    ? keyof PublicSchema["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: "public" }
    ? PublicSchema["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: "public" },
    EnumName extends PublicEnumNameOrOptions extends { schema: "public" }
    ? keyof PublicSchema["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: "public" }
    ? PublicSchema["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: "public" },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: "public"
    }
    ? keyof PublicSchema["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: "public" }
    ? PublicSchema["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
