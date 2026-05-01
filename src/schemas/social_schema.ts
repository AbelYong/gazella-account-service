import { z } from "zod";

export const TargetAccountSchema = z.object({
    targetId: z.uuidv4() 
});

export type TargetAccountInput = z.infer<typeof TargetAccountSchema>
