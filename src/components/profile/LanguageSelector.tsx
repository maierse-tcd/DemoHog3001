import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (value: string) => void;
  disabled?: boolean; // Added disabled prop as optional
}
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  disabled = false // Default to false if not provided
}) => {
  return <div className="space-y-2">
      <Label className="block text-sm font-medium text-netflix-white">Language</Label>
      <Select value={selectedLanguage} onValueChange={onLanguageChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="English">English</SelectItem>
          <SelectItem value="Spanish">Spanish</SelectItem>
          <SelectItem value="French">French</SelectItem>
          <SelectItem value="German">German</SelectItem>
          <SelectItem value="Italian">Italian</SelectItem>
          <SelectItem value="Portuguese">Portuguese</SelectItem>
          <SelectItem value="Japanese">Japanese</SelectItem>
          <SelectItem value="Chinese">Chinese</SelectItem>
        </SelectContent>
      </Select>
    </div>;
};