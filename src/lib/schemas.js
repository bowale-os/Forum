import { z } from 'zod';

export const topicSchema = z.object({
  // Rule 1: The title must be a string with at least 5 characters.
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }),

  // Rule 2: The content must be a string with at least 10 characters.
  content: z.string().min(10, { message: "Content must be at least 10 characters long." }),
});


export const replySchema = z.object({
  content: z.string().min(10, { message: "Reply must be at least 10 characters long." }),
});