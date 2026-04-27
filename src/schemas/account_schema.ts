import { z } from "zod";

export const UserRegisteredSchema = z.object({
    email: z.email({ error: "Email has the wrong format" })
        .max(128, { error: "Email is too long" }),
    name: z.string()
        .trim()
        .min(2, { error: "Name cannot be empty or be only blank space" })
        .max(32, { error: "Name cannot be longer than 32 characters" })
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$/, { 
            error: "Numbers, symbols and contiguous blank spaces are not allowed" 
        }),
    parentalSurname: z.string()
        .trim()
        .max(32, { error: "Parental surname cannot be longer than 32 characters" })
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$|^$/, { 
            error: "Numbers, symbols and contiguous blank spaces are not allowed" 
        }),
    maternalSurname: z.string()
        .trim()
        .max(32, { error: "Maternal surname cannot be longer than 32 characters" })
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$|^$/, { 
            error: "Numbers, symbols and contiguous blank spaces are not allowed" 
        }),
    userId: z.uuid({ error: "Invalid user ID format" })
});

export type UserRegisteredInput = z.infer<typeof UserRegisteredSchema>;

export const AccountQuerySchema = z.object({
    id: z.uuidv4()
});

export type AccountQueryInput = z.infer<typeof AccountQuerySchema>;
