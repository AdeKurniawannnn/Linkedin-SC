"use client";

import { useState } from "react";
import { QueryGeneratorForm, GenerateResponse } from "@/components/QueryGeneratorForm";
import { QueryResultsDisplay } from "@/components/QueryResultsDisplay";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Query Generator
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate LinkedIn search query variants using GLM AI
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Form */}
        <QueryGeneratorForm
          onGenerate={setResult}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />

        {/* Results */}
        {result && <QueryResultsDisplay result={result} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            Powered by Claude Agent SDK + GLM 4.7
          </p>
        </div>
      </footer>
    </div>
  );
}
