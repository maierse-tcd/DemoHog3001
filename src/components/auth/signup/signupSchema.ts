import * as z from 'zod';
import { passwordSchema } from './PasswordFields';
import { kidsAccountSchema } from './KidsAccountToggle';

// Define the schema for the signup form
export const signupFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  ...passwordSchema.shape,
  ...kidsAccountSchema.shape
});

export type SignUpFormData = z.infer<typeof signupFormSchema>;