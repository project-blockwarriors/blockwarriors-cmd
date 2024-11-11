"use server";

import { createSupabaseClient } from "@/auth/server";

export async function getPosts() {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase.from('Posts').select('*');
    return { data, error };
}

export async function getPost(postid) {
    const supabase = await createSupabaseClient();
    const { data, error } = await supabase
      .from('Posts')
      .select('*')
      .eq('post_id', postid)
      .single();
    return { data, error };
}

export async function createPost(post) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('Posts').insert(post);
    return { data, error };
}

export async function deletePost(postId) {
    const supabase = await createSupabaseClient();
    
    try {
        // Delete replies first
        const { error: repliesError } = await supabase
            .from('Replies')
            .delete()
            .eq('replying_to_post_id', postId);

        if (repliesError) throw repliesError;

        // Delete the post
        const { error: postError } = await supabase
            .from('Posts')
            .delete()
            .eq('post_id', postId);

        if (postError) throw postError;

        return { success: true, error: null };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function updatePostLikes(postid, likes) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from('Posts')
    .update({ likes })
    .eq('post_id', postid);
  return { data, error };
}