"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SpinnerGap } from "@phosphor-icons/react";

interface FormState {
  inputText: string;
  count: number;
  focus: string;
}

export interface GenerateResponse {
  input: string;
  queries: Record<string, string | string[]>;
  meta?: Record<string, string>;
}

interface QueryGeneratorFormProps {
  onGenerate: (result: GenerateResponse) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const FOCUS_OPTIONS = [
  { value: "none", label: "None - balanced mix" },
  { value: "broad", label: "Maximum reach" },
  { value: "narrow", label: "Maximum precision" },
  { value: "balanced", label: "Middle ground" },
  { value: "industry_focused", label: "Deep industry coverage" },
  { value: "seniority_focused", label: "Executive titles" },
  { value: "location_focused", label: "Geographic expansion" },
  { value: "ultra_broad", label: "Maximum expansion" },
  { value: "ultra_narrow", label: "Single exact terms" },
  { value: "decision_maker", label: "Key decision makers" },
  { value: "emerging_market", label: "Emerging market profiles" },
];

export function QueryGeneratorForm({
  onGenerate,
  isLoading,
  setIsLoading,
}: QueryGeneratorFormProps) {
  const [inputText, setInputText] = useState("");
  const [count, setCount] = useState(10);
  const [focus, setFocus] = useState("none");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_text: inputText,
          count,
          focus: focus === "none" ? undefined : focus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Generation failed");
      }

      const data = await response.json();
      onGenerate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || inputText.length < 3;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="space-y-2">
          <Label htmlFor="input-text">Search Input</Label>
          <Textarea
            id="input-text"
            placeholder="e.g., CEO Jakarta fintech startup"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={500}
            className="min-h-24"
          />
          <div className="text-xs text-muted-foreground text-right">
            {inputText.length} / 500
          </div>
        </div>

        {/* Count Slider Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="count-slider">Number of Variants</Label>
            <span className="text-sm font-semibold">{count} variants</span>
          </div>
          <Slider
            id="count-slider"
            min={1}
            max={30}
            value={[count]}
            onValueChange={(values) => setCount(values[0])}
          />
        </div>

        {/* Focus Type Section */}
        <div className="space-y-2">
          <Label htmlFor="focus-select">Focus Type (Optional)</Label>
          <Select value={focus} onValueChange={setFocus}>
            <SelectTrigger id="focus-select" className="w-full">
              <SelectValue placeholder="Select focus type" />
            </SelectTrigger>
            <SelectContent>
              {FOCUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleSubmit}
          disabled={isDisabled}
          className="w-full"
        >
          {isLoading ? (
            <>
              <SpinnerGap className="animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Queries"
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
