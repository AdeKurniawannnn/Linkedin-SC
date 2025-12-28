"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export interface AllSearchParams {
  keywords: string;
  location: string;
  max_results: number;
  language: string;
  country: string;
}

interface AllSearchFormProps {
  onSearch: (params: AllSearchParams) => void;
  isLoading?: boolean;
}

export function AllSearchForm({ onSearch, isLoading = false }: AllSearchFormProps) {
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [maxResults, setMaxResults] = useState(20);
  const [language, setLanguage] = useState("id");
  const [country, setCountry] = useState("id");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!keywords.trim()) {
      alert("Keywords are required!");
      return;
    }

    onSearch({
      keywords: keywords.trim(),
      location: location.trim(),
      max_results: maxResults,
      language,
      country,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Search All LinkedIn Content</CardTitle>
        <CardDescription>
          Cari semua jenis konten LinkedIn (Profiles, Companies, Posts, Jobs)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Keywords - Required */}
          <div className="space-y-2">
            <Label htmlFor="keywords" className="text-sm font-medium">
              Keywords <span className="text-red-500">*</span>
            </Label>
            <Input
              id="keywords"
              type="text"
              placeholder="e.g., Software Engineer, Startup Indonesia, Tech Company"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Masukkan kata kunci untuk mencari di semua konten LinkedIn
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium">
              Location (Optional)
            </Label>
            <Input
              id="location"
              type="text"
              placeholder="e.g., Jakarta, Indonesia"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Filter berdasarkan lokasi geografis
            </p>
          </div>

          {/* Max Results */}
          <div className="space-y-2">
            <Label htmlFor="max_results" className="text-sm font-medium">
              Max Results
            </Label>
            <Input
              id="max_results"
              type="number"
              min="1"
              max="100"
              value={maxResults}
              onChange={(e) => setMaxResults(parseInt(e.target.value) || 20)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Jumlah maksimal hasil yang dicari (1-100)
            </p>
          </div>

          {/* Country & Language Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">
                Country Code
              </Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Indonesia (ID)</SelectItem>
                  <SelectItem value="us">United States (US)</SelectItem>
                  <SelectItem value="sg">Singapore (SG)</SelectItem>
                  <SelectItem value="my">Malaysia (MY)</SelectItem>
                  <SelectItem value="uk">United Kingdom (UK)</SelectItem>
                  <SelectItem value="au">Australia (AU)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium">
                Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Bahasa Indonesia</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>Searching...</>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Search All Content
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
