"use server";

import { createSupabaseClient } from "@/auth/server";

export async function updateProfile({ id, first_name, last_name }) {
    const supabase = await createSupabaseClient();

    const { error } = await supabase.from('profiles').update({
        first_name,
        last_name,
    }).eq('id', id);

    if (error) {
        return { errorMessage: "Failed to update profile" };
    };

    return { errorMessage: null };
}