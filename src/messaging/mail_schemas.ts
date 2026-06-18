import { z } from "zod"

export const DraftPublishedEmailSchema = z.object({
    reviewers: z.array(z.object({
        id: z.uuidv4(),
        email: z.email()
    })),
    draftId: z.uuidv4(),
    title: z.string().max(128),
    authorName: z.string().max(64),
    summary: z.string().max(500)
});

export type DraftPublishedOutput = z.infer<typeof DraftPublishedEmailSchema>;

export const ArticlePublishedEmailSchema = z.object({
    authorEmail: z.email(),
    articleId: z.uuidv4(),
    authorId: z.uuidv4(),
    title: z.string().max(128),
    authorName: z.string().max(128),
});

export type ArticlePublishedOutput = z.infer<typeof ArticlePublishedEmailSchema>;

export const ArticleRejectedEmailSchema = z.object({
    authorEmail: z.email(),
    articleId: z.uuidv4(),
    authorId: z.uuidv4(),
    title: z.string().max(128),
    authorName: z.string().max(128),
});

export type ArticleRejectedOutput= z.infer<typeof ArticleRejectedEmailSchema>;