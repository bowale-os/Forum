import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseConfig';
import { CreateTopicForm } from './CreateTopicForm';
import { TopicDetail } from './TopicDetail';
import type { Session } from '@supabase/supabase-js';
import type { Topic } from '../lib/types';

// A simple loading spinner for visual feedback
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="w-8 h-8 border-2 border-slate-200 border-t-sage-500 rounded-full animate-spin"></div>
  </div>
);

// Correctly typed the date parameter and logic
function timeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minutes ago";
  }
  return Math.floor(seconds) + " seconds ago";
}

interface ForumProps {
  session: Session;
}

export function Forum({ session }: ForumProps) {
  // Explicitly typing the state to be an array of Topic objects
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const fetchTopics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('topics')
      .select('id, title, created_at, content, profiles(username)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching topics:', error);
      setTopics([]); // Set to empty array on error
    } else {
      // Transform the data to match our Topic interface
      const transformedData = data?.map(item => ({
        ...item,
        profiles: item.profiles?.[0] || { username: 'Unknown' }
      })) || [];
      setTopics(transformedData as Topic[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleTopicCreated = () => {
    setShowCreateForm(false);
    fetchTopics();
  };
  
  const handleBackFromDetail = () => {
    setSelectedTopic(null);
    fetchTopics(); // Re-fetch topics to see any new replies
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Show topic detail if a topic is selected
  if (selectedTopic) {
    // Correctly pass the session prop to TopicDetail
    return <TopicDetail topic={selectedTopic} onBack={handleBackFromDetail} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-serif font-bold text-slate-800">Forum</h2>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            New Post
          </button>
        </div>

        {showCreateForm && (
          <CreateTopicForm
            onCancel={() => setShowCreateForm(false)}
            onTopicCreated={handleTopicCreated}
            session={session}
          />
        )}

        {topics.length === 0 && !showCreateForm ? (
          <p className="text-center text-slate-500 py-10">
            No topics found. Be the first to start a discussion!
          </p>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <div 
                key={topic.id} 
                className="p-6 border border-slate-200 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTopic(topic)}
              >
                <h3 className="text-xl font-bold text-slate-800 mb-1">{topic.title}</h3>
                <div className="text-sm text-slate-500">
                  <p>by {topic.profiles.username || 'Unknown author'}</p>
                  <p>{timeAgo(topic.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
