import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '../../ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form';
import { PasswordFields } from './PasswordFields';
import { KidsAccountToggle } from './KidsAccountToggle';
import { LanguageSelector } from '../../profile/LanguageSelector';
import { SignUpFormData } from './signupSchema';

interface SignUpFieldsProps {
  form: UseFormReturn<SignUpFormData>;
}

export const SignUpFields: React.FC<SignUpFieldsProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="Enter your email" {...field} type="email" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Language selector */}
      <FormField
        control={form.control}
        name="language"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <LanguageSelector
                selectedLanguage={field.value}
                onLanguageChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Password fields component */}
      <PasswordFields form={form} />
      
      {/* Kids account toggle component */}
      <KidsAccountToggle form={form} />
    </>
  );
};