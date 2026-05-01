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
        }).optional(),
    maternalSurname: z.string()
        .trim()
        .max(32, { error: "Maternal surname cannot be longer than 32 characters" })
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$|^$/, { 
            error: "Numbers, symbols and contiguous blank spaces are not allowed" 
        }).optional(),
    role: z.string()
        .trim()
        .max(64, { error: "Role cannot be longer than 64 characters" }),
    registratedAt: z.coerce.date(),
    userId: z.uuid({ error: "Invalid user ID format" })
});

export type UserRegisteredInput = z.infer<typeof UserRegisteredSchema>;

export const AccountParamsSchema = z.object({
    id: z.uuidv4()
}); 

export type AccountParamsInput = z.infer<typeof AccountParamsSchema>;

export const UpdateAccountSchema = z.object({
    pfpUri: z.string().max(256).optional().nullable(),
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
        }).optional().nullable(),
    maternalSurname: z.string()
        .trim()
        .max(32, { error: "Maternal surname cannot be longer than 32 characters" })
        .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?: [a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$|^$/, { 
            error: "Numbers, symbols and contiguous blank spaces are not allowed" 
        }).optional().nullable(),
    bio: z.string()
        .trim()
        .max(512, { error: "Biography cannot exceed 512 characters" }).optional().nullable(),
});

export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>;
