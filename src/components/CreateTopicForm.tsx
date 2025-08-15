import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "../lib/supabaseConfig";
import { z } from "zod";

// Define the Zod schema for your form data.
const topicSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters.").max(100, "Title cannot exceed 100 characters."),
    content: z.string().min(10, "Content must be at least 10 characters."),
});

// Define a type for the Supabase Session object,
// assuming it has a 'user' property with an 'id'.
interface Session {
    user: {
        id: string;
    };
}

// Define types for the component's props
interface CreateTopicFormProps {
    onCancel: () => void;
    onTopicCreated: () => void;
    session: Session;
}

export function CreateTopicForm({ onCancel, onTopicCreated, session }: CreateTopicFormProps) {

    const {
        register, 
        handleSubmit, 
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(topicSchema),
    });

    // We use the inferred type from the schema for type safety.
    async function onSubmit(data: z.infer<typeof topicSchema>) {
        const { error } = await supabase
            .from('topics')
            .insert({ title: data.title, content: data.content, writer_id: session.user.id });
        if (error) {
            console.error('Error creating topic:', error);
        } else {
            onTopicCreated();
        }
    }

    return (
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm mb-8 border border-slate-200">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Title Input */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                        Topic Title
                    </label>
                    <input
                        id="title"
                        type="text"
                        placeholder="What's the main idea?"
                        {...register("title")}
                        aria-invalid={errors.title ? "true" : "false"}
                        className={`w-full px-4 py-2 bg-white border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sage-500 transition-colors ${
                            errors.title ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
                        }`}
                    />
                    {/* Show error message if it exists */}
                    {errors.title && <p className="text-red-600 text-sm mt-2">{errors.title.message}</p>}
                </div>

                {/* Content Textarea */}
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
                        Content
                    </label>
                    <textarea
                        id="content"
                        placeholder="Share your thoughts in more detail..."
                        {...register("content")}
                        aria-invalid={errors.content ? "true" : "false"}
                        className={`w-full px-4 py-2 bg-white border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sage-500 transition-colors ${
                            errors.content ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
                        }`}
                        rows={5}
                    />
                    {errors.content && <p className="text-red-600 text-sm mt-2">{errors.content.message}</p>}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end items-center gap-4 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Topic'}
                    </button>
                </div>
            </form>
        </div>
    );
}
