
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form';
import { Input } from '../../ui/input';
import { UseFormReturn } from 'react-hook-form';
import * as z from 'zod';

interface PasswordFieldsProps {
  form: UseFormReturn<any>;
}

// Form schema for password validation
export const passwordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string()
});

export const PasswordFields: React.FC<PasswordFieldsProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input placeholder="Enter your password" {...field} type="password" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Confirm Password</FormLabel>
            <FormControl>
              <Input placeholder="Confirm your password" {...field} type="password" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
