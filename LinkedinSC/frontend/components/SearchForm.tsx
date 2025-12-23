"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";

interface SearchFormProps {
  onSearch: (params: {
    role: string;
    location: string;
    country: string;
    language: string;
    max_pages: number;
  }) => void;
  isLoading: boolean;
}

const COUNTRIES = [
  { code: "us", name: "United States" },
  { code: "uk", name: "United Kingdom" },
  { code: "id", name: "Indonesia" },
  { code: "sg", name: "Singapore" },
  { code: "au", name: "Australia" },
  { code: "de", name: "Germany" },
  { code: "fr", name: "France" },
  { code: "jp", name: "Japan" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "id", name: "Indonesia" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "ja", name: "日本語" },
];

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("us");
  const [language, setLanguage] = useState("en");
  const [maxPages, setMaxPages] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role.trim()) {
      onSearch({
        role: role.trim(),
        location: location.trim(),
        country,
        language,
        max_pages: maxPages,
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Search LinkedIn Profiles</CardTitle>
        <CardDescription>
          Find candidates by job role and location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Input */}
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Job Role *
            </label>
            <Input
              id="role"
              placeholder="e.g., Software Engineer, IT Programmer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Location (Optional)
            </label>
            <Input
              id="location"
              placeholder="e.g., Jakarta, Singapore, New York"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Country Select */}
          <div className="space-y-2">
            <label htmlFor="country" className="text-sm font-medium">
              Country
            </label>
            <Select value={country} onValueChange={setCountry} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language Select */}
          <div className="space-y-2">
            <label htmlFor="language" className="text-sm font-medium">
              Language
            </label>
            <Select value={language} onValueChange={setLanguage} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max Pages Input */}
          <div className="space-y-2">
            <label htmlFor="maxPages" className="text-sm font-medium">
              Max Pages (1-25)
            </label>
            <Input
              id="maxPages"
              type="number"
              min={1}
              max={25}
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Approximately {maxPages * 10} results
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading || !role.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search Profiles
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
