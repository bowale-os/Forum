import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseConfig";
import { UserActivity } from "./UserActivity";
import type { Session } from '@supabase/supabase-js';
import type { Topic, Reply } from '../lib/types';

// A simple loading spinner for visual feedback
const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-10">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-sage-500 rounded-full animate-spin"></div>
    </div>
);

interface AccountFormProps {
    user: Session['user'];
    usernameInput: string;
    setUsernameInput: React.Dispatch<React.SetStateAction<string>>;
    loading: boolean;
    checkingUsername: boolean;
    isUsernameTaken: boolean;
    message: string;
    handleSubmit: (event: React.FormEvent) => Promise<void>;
}

// Memoize the form component to prevent unnecessary re-renders
const AccountForm = React.memo(({ user, usernameInput, setUsernameInput, loading, checkingUsername, isUsernameTaken, message, handleSubmit }: AccountFormProps) => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-lg mx-auto">
            <h2 className="text-2xl font-serif text-slate-800 mb-2">Account Settings</h2>
            <p className="text-slate-500 mb-8">Manage your public profile information.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                    <input
                        type="text"
                        value={user.email}
                        disabled
                        className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-500 cursor-not-allowed"
                    />
                </div>
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-600 mb-1">Username</label>
                    <input
                        id="username"
                        type="text"
                        value={usernameInput || ""}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={loading || checkingUsername || isUsernameTaken}
                        className="w-full bg-sage-600 hover:bg-sage-700 text-slate-800 font-bold py-3 px-4 rounded-md transition-colors duration-300 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Update Profile"}
                    </button>
                </div>
            </form>

            {message && (
                <p className="text-center text-sm text-slate-600 mt-6">{message}</p>
            )}
        </div>
    );
});


interface AccountProps {
    session: Session;
}

export function Account({ session }: AccountProps) {
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState<string | null>(null);
    const [usernameInput, setUsernameInput] = useState('');
    const [message, setMessage] = useState('');
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [isUsernameTaken, setIsUsernameTaken] = useState(false);
    const { user } = session;

    // State for the user's posts and replies
    const [posts, setPosts] = useState<Topic[] | null>(null);
    const [replies, setReplies] = useState<Reply[] | null>(null);
    const [postsLoading, setPostsLoading] = useState(true);
    const [repliesLoading, setRepliesLoading] = useState(true);

    // Initial fetch for the username
    useEffect(() => {
        async function fetchInfo() {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();

            if (error && (error as any).status !== 406) {
                console.error("Error fetching user data:", error.message);
                setMessage('Error loading profile.');
            } else if (data) {
                setUsername(data.username);
                setUsernameInput(data.username || "");
            }
            setLoading(false);
        }
        fetchInfo();
    }, [user.id]);


    // Debounced username availability check
    useEffect(() => {
        if (!usernameInput || usernameInput === username) {
            setCheckingUsername(false);
            setMessage(""); 
            setIsUsernameTaken(false);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setCheckingUsername(true);
            const { data } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', usernameInput)
                .maybeSingle();

            setCheckingUsername(false);

            if (data) {
                setMessage("This username is in use.");
                setIsUsernameTaken(true);
            } else {
                setMessage("Username is available!");
                setIsUsernameTaken(false);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);

    }, [username, usernameInput]);

    // This is the function that will fetch both posts and replies.
    const fetchUserActivity = useCallback(async () => {
        setPostsLoading(true);
        setRepliesLoading(true);

        try {
            // Fetch posts
            const { data: postsData, error: postsError } = await supabase
                .from('topics')
                .select('id, title, content, created_at, profiles(username)')
                .eq('writer_id', user.id)
                .order('created_at', { ascending: false });
            if (postsError) throw postsError;
            
            // Transform the data to match our Topic interface
            const transformedPosts = postsData?.map(post => ({
                ...post,
                profiles: post.profiles?.[0] || { username: 'Unknown' }
            })) || [];
            setPosts(transformedPosts as Topic[]);

            // Fetch replies
            const { data: repliesData, error: repliesError } = await supabase
                .from('replies')
                .select('id, content, created_at, topic_id, profiles(username)')
                .eq('replier_id', user.id)
                .order('created_at', { ascending: false });
            if (repliesError) throw repliesError;
            
            // Transform the data to match our Reply interface
            const transformedReplies = repliesData?.map(reply => ({
                ...reply,
                profiles: reply.profiles?.[0] || { username: 'Unknown' }
            })) || [];
            setReplies(transformedReplies as Reply[]);
        } catch (error: any) {
            console.error("Error fetching user activity:", error.message);
        } finally {
            setPostsLoading(false);
            setRepliesLoading(false);
        }
    }, [user.id]);

    // A single useEffect hook to handle the initial fetch of posts and replies
    useEffect(() => {
        fetchUserActivity();
    }, [user.id, fetchUserActivity]);


    const updateProfile = useCallback(
        async (event: React.FormEvent) => {
            event.preventDefault();
            
            if (isUsernameTaken) {
                setMessage("Please choose an available username.");
                return;
            }

            setLoading(true);
            setMessage("Updating profile...");

            try {
                const updates = {
                    id: user.id,
                    username: usernameInput,
                    updated_at: new Date().toISOString(),
                };

                const { error } = await supabase.from("profiles").upsert(updates);

                if (error) {
                    setMessage("Error updating profile. Is that username taken?");
                    console.error(error);
                } else {
                    setUsername(usernameInput);
                    setMessage("Profile updated successfully!");
                }
            } catch (error: any) {
                setMessage("An unexpected error occurred.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        },
        [user.id, usernameInput, isUsernameTaken]
    );

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto p-4">
            <div className="md:w-1/2">
                <AccountForm
                    user={user}
                    usernameInput={usernameInput}
                    setUsernameInput={setUsernameInput}
                    loading={loading}
                    checkingUsername={checkingUsername}
                    isUsernameTaken={isUsernameTaken}
                    message={message}
                    handleSubmit={updateProfile}
                />
            </div>
            <div className="md:w-1/2">
                <UserActivity
                    posts={posts}
                    replies={replies}
                    postsLoading={postsLoading} 
                    repliesLoading={repliesLoading}
                    onDataUpdated={fetchUserActivity}
                />
            </div>
        </div>
    );
}
