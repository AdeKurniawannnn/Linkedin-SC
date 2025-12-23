"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { X } from "lucide-react";

/**
 * SearchModifiers Component
 *
 * Komponen untuk menambahkan Google search modifiers ke query LinkedIn.
 * Terintegrasi dengan Zustand store untuk state management.
 *
 * Features:
 * - Must Have Keywords: Keywords yang harus ada dalam hasil
 * - Exclude Keywords: Keywords yang akan di-exclude (prefix -)
 * - Exact Match Phrases: Phrases dengan exact match (quotes)
 * - OR Operator Toggle: Gunakan OR antara must-have keywords
 * - Wildcard Toggle: Aktifkan wildcard matching (*)
 * - Enter key shortcuts untuk quick adding
 */
export function SearchModifiers() {
  // Local input state
  const [mustHaveInput, setMustHaveInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
  const [exactMatchInput, setExactMatchInput] = useState("");

  // Zustand store
  const modifiers = useQueryBuilderStore((state) => state.modifiers);
  const addMustHaveKeyword = useQueryBuilderStore((state) => state.addMustHaveKeyword);
  const removeMustHaveKeyword = useQueryBuilderStore((state) => state.removeMustHaveKeyword);
  const addExcludeKeyword = useQueryBuilderStore((state) => state.addExcludeKeyword);
  const removeExcludeKeyword = useQueryBuilderStore((state) => state.removeExcludeKeyword);
  const addExactMatchPhrase = useQueryBuilderStore((state) => state.addExactMatchPhrase);
  const removeExactMatchPhrase = useQueryBuilderStore((state) => state.removeExactMatchPhrase);
  const toggleOrOperator = useQueryBuilderStore((state) => state.toggleOrOperator);
  const toggleWildcard = useQueryBuilderStore((state) => state.toggleWildcard);

  // Debug: Log current state
  console.log('SearchModifiers render - OR:', modifiers.useOrOperator, 'Wildcard:', modifiers.useWildcard);

  // Wrapper handlers for debugging
  const handleToggleOr = () => {
    console.log('Toggle OR clicked - before:', modifiers.useOrOperator);
    toggleOrOperator();
  };

  const handleToggleWildcard = () => {
    console.log('Toggle Wildcard clicked - before:', modifiers.useWildcard);
    toggleWildcard();
  };

  // Handlers
  const handleAddMustHave = () => {
    if (mustHaveInput.trim()) {
      addMustHaveKeyword(mustHaveInput.trim());
      setMustHaveInput("");
    }
  };

  const handleAddExclude = () => {
    if (excludeInput.trim()) {
      addExcludeKeyword(excludeInput.trim());
      setExcludeInput("");
    }
  };

  const handleAddExactMatch = () => {
    if (exactMatchInput.trim()) {
      addExactMatchPhrase(exactMatchInput.trim());
      setExactMatchInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, handler: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handler();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Modifiers</CardTitle>
        <CardDescription>
          Tambahkan modifier untuk query yang lebih spesifik
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Must Have Keywords */}
        <div className="space-y-2">
          <Label htmlFor="mustHave">Must Have Keywords</Label>
          <div className="flex gap-2">
            <Input
              id="mustHave"
              placeholder="e.g., software, engineer, python"
              value={mustHaveInput}
              onChange={(e) => setMustHaveInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAddMustHave)}
            />
            <Button size="sm" onClick={handleAddMustHave}>
              Add
            </Button>
          </div>
          {modifiers.mustHaveKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {modifiers.mustHaveKeywords.map((keyword) => (
                <Badge key={keyword} variant="default" className="flex items-center gap-1">
                  {keyword}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeMustHaveKeyword(keyword)}
                  />
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Keywords yang harus ada dalam hasil pencarian
          </p>
        </div>

        {/* Exclude Keywords */}
        <div className="space-y-2">
          <Label htmlFor="exclude">Exclude Keywords</Label>
          <div className="flex gap-2">
            <Input
              id="exclude"
              placeholder="e.g., recruiter, agency, outsourcing"
              value={excludeInput}
              onChange={(e) => setExcludeInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAddExclude)}
            />
            <Button size="sm" variant="destructive" onClick={handleAddExclude}>
              Add
            </Button>
          </div>
          {modifiers.excludeKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {modifiers.excludeKeywords.map((keyword) => (
                <Badge key={keyword} variant="destructive" className="flex items-center gap-1">
                  -{keyword}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeExcludeKeyword(keyword)}
                  />
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Keywords yang akan di-exclude dari hasil (dengan prefix -)
          </p>
        </div>

        {/* Exact Match Phrases */}
        <div className="space-y-2">
          <Label htmlFor="exactMatch">Exact Match Phrases</Label>
          <div className="flex gap-2">
            <Input
              id="exactMatch"
              placeholder='e.g., senior developer, tech lead'
              value={exactMatchInput}
              onChange={(e) => setExactMatchInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, handleAddExactMatch)}
            />
            <Button size="sm" variant="secondary" onClick={handleAddExactMatch}>
              Add
            </Button>
          </div>
          {modifiers.exactMatchPhrases.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {modifiers.exactMatchPhrases.map((phrase) => (
                <Badge key={phrase} variant="secondary" className="flex items-center gap-1">
                  "{phrase}"
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeExactMatchPhrase(phrase)}
                  />
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Exact match dengan quotes ("..")
          </p>
        </div>

        {/* Toggle Switches */}
        <div className="space-y-4 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="orOperator">Use OR operator</Label>
              <p className="text-xs text-gray-500">
                Gunakan OR antara must-have keywords
              </p>
            </div>
            <Switch
              id="orOperator"
              checked={modifiers.useOrOperator}
              onCheckedChange={handleToggleOr}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="wildcard">Use wildcard matching</Label>
              <p className="text-xs text-gray-500">
                Aktifkan wildcard (*) untuk matching pattern
              </p>
            </div>
            <Switch
              id="wildcard"
              checked={modifiers.useWildcard}
              onCheckedChange={handleToggleWildcard}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
