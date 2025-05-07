
import React from 'react';
import { FormField, FormItem, FormControl, FormLabel, FormDescription } from '../../ui/form';
import { Checkbox } from '../../ui/checkbox';
import { UseFormReturn } from 'react-hook-form';
import * as z from 'zod';

interface KidsAccountToggleProps {
  form: UseFormReturn<any>;
}

// Form schema for kids account toggle
export const kidsAccountSchema = z.object({
  isKidsAccount: z.boolean().optional()
});

export const KidsAccountToggle: React.FC<KidsAccountToggleProps> = ({ form }) => {
  return (
    <FormField
      control={form.control}
      name="isKidsAccount"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-netflix-gray/30">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              id="isKidsAccount"
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel htmlFor="isKidsAccount">
              This is a kids account
            </FormLabel>
            <FormDescription>
              Kids accounts have restricted content and simplified controls.
            </FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
};
