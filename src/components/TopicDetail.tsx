import { useState, useEffect } from "react";
import { CreateReplyForm } from "./CreateReplyForm";
import { supabase } from "../lib/supabaseConfig";
import type { Topic, Reply } from '../lib/types';

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

// A simple loading spinner for visual feedback
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="w-8 h-8 border-2 border-slate-200 border-t-sage-500 rounded-full animate-spin"></div>
  </div>
);

// Define types for the component's props
interface TopicDetailProps {
    topic: Topic;
    onBack: () => void;
}

export function TopicDetail({ topic, onBack }: TopicDetailProps) {
  const [loading, setLoading] = useState(true);
  const [fullTopic, setFullTopic] = useState<Topic | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [showReplyForm, setShowReplyForm] = useState(false);

  async function fetchTopicAndReplies() {
    if (!topic) return;
    setLoading(true);

    const [topicRes, repliesRes] = await Promise.all([
      supabase.from('topics').select('*, profiles(username)').eq('id', topic.id).single(),
      supabase.from('replies').select('*, profiles(username)').eq('topic_id', topic.id).order('created_at', { ascending: true })
    ]);

    if (topicRes.error) console.error("Error fetching topic:", topicRes.error);
    else {
      // Transform the data to match our Topic interface
      const topicData = topicRes.data;
      if (topicData) {
        const transformedTopic: Topic = {
          ...topicData,
          profiles: topicData.profiles?.[0] || { username: 'Unknown' }
        };
        setFullTopic(transformedTopic);
      }
    }

    if (repliesRes.error) console.error("Error fetching replies:", repliesRes.error);
    else {
      // Transform the data to match our Reply interface
      const repliesData = repliesRes.data;
      if (repliesData) {
        const transformedReplies: Reply[] = repliesData.map(reply => ({
          ...reply,
          profiles: reply.profiles?.[0] || { username: 'Unknown' }
        }));
        setReplies(transformedReplies);
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchTopicAndReplies();
  }, [topic.id]);

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        &larr; Back to all topics
      </button>

      {loading ? <LoadingSpinner /> : fullTopic && (
        <>
          {/* Main Topic Content */}
          <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-slate-200">
            <h1 className="text-3xl font-serif text-slate-900 mb-2">{fullTopic.title}</h1>
            <p className="text-sm text-slate-500 mb-6">
              by {fullTopic.profiles ? fullTopic.profiles.username : 'Unknown'} &middot; {timeAgo(fullTopic.created_at)}
            </p>
            <div className="prose max-w-none text-slate-700">{fullTopic.content}</div>
          </div>

          {/* Replies Section */}
          <div className="mt-10">
            <h2 className="text-2xl font-serif text-slate-800 mb-6">Replies ({replies.length})</h2>
            <div className="space-y-6">
              {replies.length > 0 ? replies.map(reply => (
                <div key={reply.id} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                  <p className="text-slate-700">{reply.content}</p>
                  <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    by {reply.profiles ? reply.profiles.username : 'Unknown'} &middot; {timeAgo(reply.created_at)}
                  </p>
                </div>
              )) : (
                <p className="text-slate-500 text-center py-4">No replies yet. Be the first to comment!</p>
              )}
            </div>
          </div>

          {/* Add a Reply Section */}
          {!showReplyForm ? (
            <div className="mt-10 pt-8 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowReplyForm(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-md transition-colors"
              >
                Write a Reply
              </button>
            </div>
          ) : (
            <CreateReplyForm
              topic={fullTopic}
              onCancel={() => setShowReplyForm(false)}
              onReplyCreated={() => {
                setShowReplyForm(false);
                fetchTopicAndReplies(); // Refresh the replies list
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
