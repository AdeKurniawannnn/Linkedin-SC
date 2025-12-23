"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ProgressBarProps {
  isLoading: boolean;
  message?: string;
}

export function ProgressBar({ isLoading, message }: ProgressBarProps) {
  if (!isLoading) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Scraping LinkedIn...
        </CardTitle>
        <CardDescription>
          {message || "Please wait while we search for profiles"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={undefined} className="w-full" />
        <p className="text-xs text-gray-500 mt-2 text-center">
          This may take 10-30 seconds depending on the number of pages
        </p>
      </CardContent>
    </Card>
  );
}
