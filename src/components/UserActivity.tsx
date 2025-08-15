import React, { useState } from 'react';
import { supabase } from '../lib/supabaseConfig';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-10">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
    </div>
);

export const UserActivity = ({ posts, replies, postsLoading, repliesLoading, user, onDataUpdated }) => {
    const [activeTab, setActiveTab] = useState('posts');
    const [editingItem, setEditingItem] = useState(null);
    const [editedContent, setEditedContent] = useState('');
    const [editedTitle, setEditedTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleEditClick = (item) => {
        setEditingItem(item);
        setEditedContent(item.content);
        if (item.title) {
            setEditedTitle(item.title);
        }
    };

    const handleSaveClick = async () => {
    if (!editingItem) return;
    if (!editedContent.trim() || (activeTab === 'posts' && !editedTitle.trim())) {
        alert('Title and content cannot be empty.');
        return;
    }

    setIsSaving(true);
    const tableName = activeTab === 'posts' ? 'topics' : 'replies';
    const updates = {
        content: editedContent,
    };
    console.log(editedContent);

    if (activeTab === 'posts') {
        updates.title = editedTitle;
    }

    const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', editingItem.id);

    if (error) {
        console.error('Error updating item:', error);
        setIsSaving(false);
        alert('Failed to save changes. Please try again.');
    } else {
        alert("Edited successfully!");
        
        // This is the key change: update the local state directly
        // The `onDataUpdated` prop is still useful for a full refresh if needed
        if (onDataUpdated) {
            await onDataUpdated();
        }

        setEditingItem(null); // Exit edit mode
        setIsSaving(false);
    }
};

    const renderActivityList = (activity, type) => {
        if (!activity || activity.length === 0) {
            return (
                <p className="text-center text-gray-500 py-10">
                    {type === 'posts' ? "You haven't made any posts yet." : "You haven't made any replies yet."}
                </p>
            );
        }
        return (
            <div className="space-y-4">
                {activity.map((item) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-md bg-white shadow-sm">
                        {editingItem?.id === item.id ? (
                            <div className="space-y-3">
                                {type === 'posts' && (
                                    <input
                                        type="text"
                                        value={editedTitle}
                                        onChange={(e) => setEditedTitle(e.target.value)}
                                        className="w-full text-lg font-bold border rounded p-2"
                                    />
                                )}
                                <textarea
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="w-full border rounded p-2"
                                    rows="4"
                                />
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => setEditingItem(null)}
                                        className="px-4 py-2 text-sm text-gray-600 border rounded"
                                        disabled={isSaving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveClick}
                                        className="px-4 py-2 text-sm bg-green-600 text-white font-bold rounded disabled:opacity-50"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {type === 'posts' && <h3 className="font-bold text-gray-800 text-lg">{item.title}</h3>}
                                <p className="text-sm text-gray-500">{type === 'posts' ? 'Posted on' : 'Replied on'} {new Date(item.created_at).toLocaleDateString()}</p>
                                <p className="mt-2 text-gray-700">
                                    {item.content}
                                </p>
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => handleEditClick(item)}
                                        className="text-sm text-green-600 hover:underline"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="mt-8 md:mt-0">
            <h2 className="text-2xl font-serif text-gray-800 mb-2">My Activity</h2>
            <p className="text-gray-500 mb-8">All your posts and replies in one place.</p>
            
            <div className="flex border-b border-gray-200 mb-4">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'posts' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-green-500'}`}
                >
                    Posts ({posts ? posts.length : 0})
                </button>
                <button
                    onClick={() => setActiveTab('replies')}
                    className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'replies' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-green-500'}`}
                >
                    Replies ({replies ? replies.length : 0})
                </button>
            </div>

            <div>
                {activeTab === 'posts' && (
                    postsLoading ? <LoadingSpinner /> : renderActivityList(posts, 'posts')
                )}
                {activeTab === 'replies' && (
                    repliesLoading ? <LoadingSpinner /> : renderActivityList(replies, 'replies')
                )}
            </div>
        </div>
    );
};