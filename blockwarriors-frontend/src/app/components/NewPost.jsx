'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Target, Trophy, Users } from 'lucide-react';
import Image from 'next/image';
import { createSupabaseClient } from '@/auth/client';

const tags = [
    { icon: <Image src="/logos/belt_testing.svg" alt="Belt Testing Icon" width={10} height={10} />, text: "Belt Testing" },
    { icon: <Target width={10} height={10} style={{ strokeWidth: '1.5px' }} />, text: "Practice" },
    { icon: <Image src="/logos/poomsae.svg" alt="Poomsae Icon" width={10} height={10} />, text: "Poomsae" },
    { icon: <Trophy width={10} height={10} style={{ strokeWidth: '1.5px' }} />, text: "Tournaments" },
    { icon: <Image src="/logos/sparring.svg" alt="Sparring Icon" width={10} height={10} />, text: "Sparring" },
    { icon: <Users width={10} height={10} style={{ strokeWidth: '1.5px'}} />, text: "Social" },

];

export default function NewPost({ setShowNewPost, sideBarItems }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);

    const titleRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.focus();
        }
    }, []);

    const [user, setUser] = useState(null);
    const { auth } = createSupabaseClient();

    useEffect(() => {
        const {
        data: { subscription },
        } = auth.onAuthStateChange((event, session) => {
        setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, [auth]);

    const resetFields = () => {
        setTitle('');
        setContent('');
        setSelectedTags([]);
        setShowNewPost(false);
    }

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        const post = { title, content, tags: selectedTags, user_id: user.id, date_time: new Date() };
        console.log(post)
    
        const supabase = createSupabaseClient();
        try {
            const { data, error } = await supabase.from('Posts').insert([post]);
           

            // console.log("Supabase insert response:", data, error); // Log data and error

            if (error) throw error;
    
            // Reset form fields after successful submission
            resetFields()
            window.location.reload()
        } catch (error) {
            console.error("Error creating post: ", error.message);
        }
    };
    
    

    const toggleTag = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    return (
        <div className="p-4">
            <h2 className="text-4xl font-semibold mb-4 text-center">New Post</h2>
            <form onSubmit={handlePostSubmit} className="flex flex-col">
                <input
                    ref={titleRef}
                    type="text"
                    placeholder="Post Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mb-2 border rounded p-2"
                    required
                    autoFocus
                ></input>
                <div className="mb-2">
                    <p className="mb-1 font-semibold">Categories:</p>
                    <div className="flex flex-wrap">
                        {sideBarItems.map((item) => (
                            <button
                                key={item.tag}
                                type="button"
                                onClick={() => toggleTag(item.tag)}
                                className={`flex items-center justify-center mr-2 mb-2 p-2 border rounded ${selectedTags.includes(item.tag) ? "bg-blue-200" : "bg-gray-200"}`}
                            >
                                {item.icon}
                                <span className="ml-1">{item.text}</span>
                            </button>
                        ))}
                    </div>
                    <textarea
                        ref={contentRef}
                        placeholder="Content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="mb-2 border rounded p-2"
                        style={{ width: '618px', height: '300px' }}
                        rows="4"
                        required
                    />
                    <div className="flex justify-around items-center">
                        <button type="submit" className="bg-blue-500 text-white text-lg rounded px-5 py-1">Submit</button>
                        <button
                            type="button"
                            className="bg-red-500 text-white text-lg rounded px-5 py-1"
                            onClick={() => {
                                resetFields()
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                    
                </div>        
            </form>
        </div>    
    );
}