import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseConfig";
import { CreateTopicForm } from "./CreateTopicForm";
import { TopicDetail } from "./TopicDetail";

// Helper functions and LoadingSpinner can be moved to a separate utility file
// but are kept here for simplicity.
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

export function Forum() {
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);

  async function fetchTopics() {
    setLoading(true);
    const { data, error } = await supabase
      .from('topics')
      .select('id, title, created_at, profiles(username)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching topics:", error.message);
    } else if (data) {
      setTopics(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTopics();
  }, []);

  // This function is passed to the form component
  function handleTopicCreated() {
    setShowCreateForm(false); // Hide the form
    fetchTopics(); // Refresh the topics list
  }

  // If a topic is selected, render the detail view
  if (selectedTopic) {
    return (
      <TopicDetail
        topic={selectedTopic}
        onBack={() => setSelectedTopic(null)}
      />
    );
  }

  // Otherwise, render the main forum view
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-slate-800">Topics</h1>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-sage-600 hover:bg-sage-700 text-slate-800 font-bold py-2 px-5 rounded-md transition-colors"
          >
            Add a New Topic
          </button>
        )}
      </div>

      {showCreateForm && (
        <CreateTopicForm
          onTopicCreated={handleTopicCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {topics.map(topic => (
            <div
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              className="bg-white p-6 cursor-pointer rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <h3 className="text-xl font-semibold text-slate-800 mb-1">
                {topic.title}
              </h3>
              <p className="text-sm text-slate-500">
                by {topic.profiles ? topic.profiles.username : 'Unknown author'}
                <span className="mx-2">&middot;</span>
                {timeAgo(topic.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

