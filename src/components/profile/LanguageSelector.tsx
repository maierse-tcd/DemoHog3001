
import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (value: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange
}) => {
  return (
    <div className="space-y-2">
      <Label className="block text-sm font-medium text-netflix-gray">Language</Label>
      <Select value={selectedLanguage} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-full bg-netflix-black border border-netflix-gray rounded">
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
    </div>
  );
};
