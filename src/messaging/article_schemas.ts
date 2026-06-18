import { z } from "zod";

export const DraftPublishedSchema = z.object({
    draftId: z.uuidv4(),
    title: z.string().max(128),
    authorName: z.string().max(64),
    summary: z.string().max(500)
});

export type DraftPublishedInput = z.infer<typeof DraftPublishedSchema>;

export const ArticlePublishedSchema = z.object({
    articleId: z.uuidv4(),
    authorId: z.uuidv4(),
    title: z.string().max(128),
    authorName: z.string().max(128),
});

export type ArticlePublishedInput = z.infer<typeof ArticlePublishedSchema>;

export const ArticleRejectedSchema = z.object({
    articleId: z.uuidv4(),
    authorId: z.uuidv4(),
    title: z.string().max(128),
    authorName: z.string().max(128),
});

export type ArticleRejectedInput = z.infer<typeof ArticleRejectedSchema>;
