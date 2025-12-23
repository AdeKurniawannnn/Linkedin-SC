"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PostsSearchFormProps {
  onSearch: (params: PostsSearchParams) => void;
  isLoading?: boolean;
}

export interface PostsSearchParams {
  keywords: string;
  author_type: 'all' | 'companies' | 'people';
  max_results: number;
  location: string;
  language: string;
  country: string;
}

export function PostsSearchForm({ onSearch, isLoading = false }: PostsSearchFormProps) {
  const [keywords, setKeywords] = useState("");
  const [authorType, setAuthorType] = useState<'all' | 'companies' | 'people'>('all');
  const [maxResults, setMaxResults] = useState(20);
  const [location, setLocation] = useState("");
  const [language, setLanguage] = useState("id");
  const [country, setCountry] = useState("id");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!keywords.trim()) {
      alert("Keywords harus diisi!");
      return;
    }

    onSearch({
      keywords: keywords.trim(),
      author_type: authorType,
      max_results: maxResults,
      location: location.trim(),
      language,
      country
    });
  };

  const handleClear = () => {
    setKeywords("");
    setAuthorType('all');
    setMaxResults(20);
    setLocation("");
    setLanguage("id");
    setCountry("id");
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Search LinkedIn Posts</CardTitle>
        <CardDescription>
          Find LinkedIn posts by keywords and topic
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-base font-semibold">
              Keywords / Topic <span className="text-red-500">*</span>
            </Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., artificial intelligence, machine learning"
              className="text-base"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              Keyword untuk cari postingan
            </p>
          </div>

          {/* Author Type */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Author Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="authorType"
                  value="all"
                  checked={authorType === 'all'}
                  onChange={(e) => setAuthorType(e.target.value as any)}
                  disabled={isLoading}
                  className="w-4 h-4"
                />
                <span>All</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="authorType"
                  value="companies"
                  checked={authorType === 'companies'}
                  onChange={(e) => setAuthorType(e.target.value as any)}
                  disabled={isLoading}
                  className="w-4 h-4"
                />
                <span>Companies</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="authorType"
                  value="people"
                  checked={authorType === 'people'}
                  onChange={(e) => setAuthorType(e.target.value as any)}
                  disabled={isLoading}
                  className="w-4 h-4"
                />
                <span>People</span>
              </label>
            </div>
          </div>

          {/* Max Results */}
          <div className="space-y-2">
            <Label htmlFor="maxResults" className="text-base font-semibold">
              Max Results
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="maxResults"
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value) || 20)}
                min={1}
                max={100}
                className="w-24"
                disabled={isLoading}
              />
              <span className="text-sm text-gray-500">posts (1-100)</span>
            </div>
          </div>

          {/* Location (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-base font-semibold">
              Location (Optional)
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Jakarta, Indonesia"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              Filter posts by location
            </p>
          </div>

          {/* Language & Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="text-base font-semibold">
                Language
              </Label>
              <Select value={language} onValueChange={setLanguage} disabled={isLoading}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Indonesian</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-base font-semibold">
                Country
              </Label>
              <Select value={country} onValueChange={setCountry} disabled={isLoading}>
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Indonesia</SelectItem>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="sg">Singapore</SelectItem>
                  <SelectItem value="my">Malaysia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !keywords.trim()}
              className="flex-1"
            >
              {isLoading ? "Searching..." : "Search Posts"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
