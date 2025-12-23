"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export interface JobsSearchParams {
  job_title: string;
  location: string;
  experience_level: string;
  max_results: number;
  language: string;
  country: string;
}

interface JobsSearchFormProps {
  onSearch: (params: JobsSearchParams) => void;
  isLoading?: boolean;
}

export function JobsSearchForm({ onSearch, isLoading = false }: JobsSearchFormProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("all");
  const [maxResults, setMaxResults] = useState(20);
  const [language, setLanguage] = useState("id");
  const [country, setCountry] = useState("id");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobTitle.trim()) {
      alert("Job title is required!");
      return;
    }

    onSearch({
      job_title: jobTitle.trim(),
      location: location.trim(),
      experience_level: experienceLevel,
      max_results: maxResults,
      language,
      country,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Search LinkedIn Jobs</CardTitle>
        <CardDescription>
          Cari lowongan pekerjaan di LinkedIn berdasarkan posisi dan lokasi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Title - Required */}
          <div className="space-y-2">
            <Label htmlFor="job_title" className="text-sm font-medium">
              Job Title / Position <span className="text-red-500">*</span>
            </Label>
            <Input
              id="job_title"
              type="text"
              placeholder="e.g., Software Engineer, Data Analyst, Marketing Manager"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Masukkan posisi atau job title yang dicari
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
              Filter berdasarkan kota atau negara
            </p>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <Label htmlFor="experience_level" className="text-sm font-medium">
              Experience Level
            </Label>
            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="associate">Associate</SelectItem>
                <SelectItem value="mid-senior">Mid-Senior Level</SelectItem>
                <SelectItem value="director">Director</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
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
              Jumlah maksimal lowongan yang dicari (1-100)
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
                Search Jobs
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
