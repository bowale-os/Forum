import { useState, useEffect } from "react";
import { CreateReplyForm } from "./CreateReplyForm"; // Make sure this import is correct
import { supabase } from "../lib/supabaseConfig";


export function TopicDetail({ topic, onBack }) {
  const [loading, setLoading] = useState(true);
  const [fullTopic, setFullTopic] = useState(null);
  const [replies, setReplies] = useState([]);
  const [showReplyForm, setShowReplyForm] = useState(false);

  function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="w-8 h-8 border-2 border-slate-200 border-t-sage-500 rounded-full animate-spin"></div>
  </div>
);


  async function fetchTopicAndReplies() {
    if (!topic) return;
    setLoading(true);

    // Fetch both topic and replies at the same time for efficiency
    const [topicRes, repliesRes] = await Promise.all([
      supabase.from('topics').select('*, profiles(username)').eq('id', topic.id).single(),
      supabase.from('replies').select('*, profiles(username)').eq('topic_id', topic.id).order('created_at', { ascending: true })
    ]);

    if (topicRes.error) console.error("Error fetching topic:", topicRes.error);
    else setFullTopic(topicRes.data);

    if (repliesRes.error) console.error("Error fetching replies:", repliesRes.error);
    else setReplies(repliesRes.data);

    setLoading(false);
  }

  useEffect(() => {
    fetchTopicAndReplies();
  }, [topic]);

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