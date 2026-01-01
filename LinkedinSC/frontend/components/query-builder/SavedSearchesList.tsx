"use client";

import { useState, useEffect } from "react";
import { Clock, Trash2, Play, Tag, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useConvexSavedSearches } from "@/hooks";
import type { ConvexSavedSearch } from "@/lib/convex-types";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

/**
 * SavedSearchesList Component
 *
 * Displays a list of saved searches with actions to load or delete.
 * Shows recent and most-used searches.
 */
export function SavedSearchesList() {
  const [expanded, setExpanded] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const {
    searches,
    loadSearch,
    deleteSearch,
    getRecentSearches,
    isLoading,
  } = useConvexSavedSearches();

  // Prevent hydration mismatch - localStorage only available on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const recentSearches = getRecentSearches(10);

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted || isLoading) {
    return null;
  }

  const handleLoad = async (search: ConvexSavedSearch) => {
    await loadSearch(search._id);
  };

  const handleDelete = async (search: ConvexSavedSearch) => {
    await deleteSearch(search._id);
  };

  if (searches.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Saved Searches</CardTitle>
          <CardDescription>
            Save your query configurations for quick access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No saved searches yet</p>
            <p className="text-xs mt-1">
              Click the bookmark icon in Query Preview to save
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Saved Searches</CardTitle>
            <CardDescription>
              {searches.length} saved search{searches.length !== 1 ? "es" : ""}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3">
          {recentSearches.map((search) => (
            <div
              key={search._id}
              className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{search.name}</h4>
                  {search.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {search.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLoad(search)}
                    className="h-7 w-7 p-0"
                    title="Load this search"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        title="Delete this search"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete saved search?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{search.name}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(search)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Tags */}
              {search.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {search.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {search.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{search.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Meta info */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(search.lastUsedAt), { addSuffix: true })}
                </span>
                {search.useCount > 0 && (
                  <span>Used {search.useCount}x</span>
                )}
              </div>
            </div>
          ))}

          {searches.length > 10 && (
            <p className="text-xs text-center text-muted-foreground pt-2">
              Showing 10 most recent of {searches.length} saved searches
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
