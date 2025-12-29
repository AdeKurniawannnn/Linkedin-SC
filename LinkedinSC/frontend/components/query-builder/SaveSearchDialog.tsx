"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSavedSearchesStore } from "@/stores/savedSearchesStore";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { toast } from "sonner";

interface SaveSearchDialogProps {
  trigger?: React.ReactNode;
  disabled?: boolean;
}

/**
 * SaveSearchDialog Component
 *
 * Dialog for saving the current query configuration.
 * Captures name, description, and optional tags.
 */
export function SaveSearchDialog({ trigger, disabled }: SaveSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const addSearch = useSavedSearchesStore((state) => state.addSearch);

  // Get current query builder state
  const baseQuery = useQueryBuilderStore((state) => state.baseQuery);
  const activePresetIds = useQueryBuilderStore((state) => state.activePresetIds);
  const activeLocationIds = useQueryBuilderStore((state) => state.activeLocationIds);
  const country = useQueryBuilderStore((state) => state.country);
  const language = useQueryBuilderStore((state) => state.language);
  const maxResults = useQueryBuilderStore((state) => state.maxResults);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tags: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        description: "",
        tags: "",
      });
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 50) {
      newErrors.name = "Name must be 50 characters or less";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    // Parse tags (comma-separated)
    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    addSearch({
      name: formData.name.trim(),
      description: formData.description.trim(),
      tags,
      state: {
        baseQuery,
        activePresetIds,
        activeLocationIds,
        country,
        language,
        maxResults,
      },
    });

    toast.success("Search saved successfully");
    setOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" size="icon" className="h-9 w-9" title="Save search" disabled={disabled}>
      <Bookmark className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Search</DialogTitle>
          <DialogDescription>
            Save this query configuration for quick access later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Senior Engineers in Jakarta"
              maxLength={50}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of this search (optional)"
              rows={2}
            />
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="recruiting, engineering, jakarta (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas
            </p>
          </div>

          {/* Preview of what will be saved */}
          <div className="rounded-md bg-muted p-3 space-y-2">
            <p className="text-xs font-medium">Configuration to save:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {baseQuery && <li>Base query: {baseQuery.substring(0, 50)}...</li>}
              {activePresetIds.length > 0 && (
                <li>{activePresetIds.length} preset(s) selected</li>
              )}
              {activeLocationIds.length > 0 && (
                <li>{activeLocationIds.length} location(s) selected</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Search</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
