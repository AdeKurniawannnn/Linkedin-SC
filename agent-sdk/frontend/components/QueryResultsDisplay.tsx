"use client";

import { Copy, CopySimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QueryResultsDisplayProps {
  result: {
    input: string;
    queries: Record<string, string | string[]>;
    meta?: Record<string, string>;
  };
}

// Flatten queries to array
const getAllQueries = (queries: Record<string, string | string[]>): string[] => {
  return Object.values(queries).flatMap(v => Array.isArray(v) ? v : [v]);
};

// Get total count
const getTotalCount = (queries: Record<string, string | string[]>): number => {
  return getAllQueries(queries).length;
};

// Copy to clipboard
const copyToClipboard = async (text: string, label: string = "Query") => {
  await navigator.clipboard.writeText(text);
  toast.success(`${label} copied to clipboard`);
};

// Copy all queries
const copyAllQueries = async (queries: Record<string, string | string[]>) => {
  const all = getAllQueries(queries);
  await navigator.clipboard.writeText(all.join('\n\n'));
  toast.success(`${all.length} queries copied to clipboard`);
};

// Map types to badge variants
const getBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
  const lowerType = type.toLowerCase();

  if (lowerType.includes("broad")) {
    return "secondary";
  }
  if (lowerType.includes("narrow")) {
    return "outline";
  }
  if (lowerType === "balanced") {
    return "default";
  }
  if (["industry_focused", "seniority_focused", "location_focused", "decision_maker", "emerging_market"].includes(lowerType)) {
    return "secondary";
  }

  return "default";
};

export function QueryResultsDisplay({ result }: QueryResultsDisplayProps) {
  const { queries } = result;
  const totalCount = getTotalCount(queries);
  const isEmpty = Object.keys(queries).length === 0;

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No queries generated
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Generated Queries
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({totalCount} {totalCount === 1 ? "query" : "queries"})
          </span>
        </CardTitle>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyAllQueries(queries)}
          >
            <CopySimple weight="bold" />
            Copy All
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-6">
        {Object.entries(queries).map(([type, value]) => {
          const queryList = Array.isArray(value) ? value : [value];

          return (
            <div key={type} className="space-y-3">
              <Badge variant={getBadgeVariant(type)}>
                {type.replace(/_/g, " ")}
              </Badge>

              <div className="space-y-2">
                {queryList.map((query, index) => (
                  <div
                    key={index}
                    className="group relative rounded-lg border bg-muted p-4 hover:border-muted-foreground/20 transition-colors"
                  >
                    <code className="font-mono text-sm break-words block pr-10">
                      {query}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(query, "Query")}
                    >
                      <Copy weight="bold" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
