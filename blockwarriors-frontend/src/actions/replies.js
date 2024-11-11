"use server";

import { createSupabaseClient } from "@/auth/server";

export async function createReply(reply) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.from('Replies').insert(reply);
    return { data, error };
}

export async function getRepliesForPost(postid) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.from('Replies').select('*').eq('replying_to_post_id', postid);
    return { data, error };
}

export async function deleteRepliesForPost(postid) {
    const supabase = await createSupabaseClient();
    const { error } = await supabase
        .from('Replies')
        .delete()
        .eq('replying_to_post_id', postid);
    return { error };
}