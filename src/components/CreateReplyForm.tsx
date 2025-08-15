import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { replySchema } from "../lib/schemas"; // Make sure you have a replySchema in this file
import { supabase } from "../lib/supabaseConfig";


export function CreateReplyForm({ topic, onCancel, onReplyCreated }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(replySchema),
  });

  async function onSubmit(data) {
    // This is simpler and more secure.
    // The database automatically sets the user_id for us.
    const { error } = await supabase
      .from('replies')
      .insert({ content: data.content, topic_id: topic.id });

    if (error) {
      console.error('Error creating reply:', error);
    } else {
      reset(); // Clear the form fields
      onReplyCreated(); // Tell the parent component we are done
    }
  }

  return (
    <div className="mt-10 pt-8 border-t border-slate-200">
      <h3 className="text-xl font-serif text-slate-800 mb-4">Join the conversation</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="reply-content" className="sr-only">Your Reply</label>
          <textarea
            id="reply-content"
            placeholder="Write your reply..."
            {...register("content")}
            className={`w-full px-4 py-2 bg-white border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sage-500 transition-colors ${
              errors.content ? 'border-red-500' : 'border-slate-300'
            }`}
            rows="4"
          />
          {errors.content && <p className="text-red-600 text-sm mt-2">{errors.content.message}</p>}
        </div>
        <div className="flex justify-end items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-md transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Reply'}
          </button>
        </div>
      </form>
    </div>
  );
}
