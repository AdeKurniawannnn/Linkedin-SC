"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCustomPresetsStore, type CustomPreset } from "@/stores/customPresetsStore";
import { PRESET_CATEGORIES, type PresetCategory } from "@/config/queryPresets";

interface CustomPresetDialogProps {
  mode?: "create" | "edit";
  preset?: CustomPreset;
  trigger?: React.ReactNode;
}

/**
 * CustomPresetDialog Component
 *
 * Dialog for creating or editing custom query presets.
 * Allows users to define their own search patterns.
 */
export function CustomPresetDialog({
  mode = "create",
  preset,
  trigger,
}: CustomPresetDialogProps) {
  const [open, setOpen] = useState(false);
  const addPreset = useCustomPresetsStore((state) => state.addPreset);
  const updatePreset = useCustomPresetsStore((state) => state.updatePreset);

  const [formData, setFormData] = useState({
    category: (preset?.category || "custom") as PresetCategory | "custom",
    label: preset?.label || "",
    description: preset?.description || "",
    queryFragment: preset?.queryFragment || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens/closes or preset changes
  useEffect(() => {
    if (open) {
      setFormData({
        category: (preset?.category || "custom") as PresetCategory | "custom",
        label: preset?.label || "",
        description: preset?.description || "",
        queryFragment: preset?.queryFragment || "",
      });
      setErrors({});
    }
  }, [open, preset]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.label.trim()) {
      newErrors.label = "Label is required";
    } else if (formData.label.length > 30) {
      newErrors.label = "Label must be 30 characters or less";
    }

    if (!formData.queryFragment.trim()) {
      newErrors.queryFragment = "Query fragment is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (mode === "create") {
      addPreset({
        category: formData.category,
        label: formData.label.trim(),
        description: formData.description.trim(),
        queryFragment: formData.queryFragment.trim(),
      });
    } else if (preset) {
      updatePreset(preset.id, {
        category: formData.category,
        label: formData.label.trim(),
        description: formData.description.trim(),
        queryFragment: formData.queryFragment.trim(),
      });
    }

    setOpen(false);
  };

  const defaultTrigger =
    mode === "create" ? (
      <Button variant="outline" size="sm" className="gap-2">
        <Plus className="h-4 w-4" />
        Add Custom Preset
      </Button>
    ) : (
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
        <Pencil className="h-4 w-4" />
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Custom Preset" : "Edit Preset"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a reusable search pattern for your queries."
              : "Update your custom preset settings."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Category Select */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value as PresetCategory | "custom" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">My Presets</SelectItem>
                {Object.entries(PRESET_CATEGORIES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Label Input */}
          <div className="space-y-2">
            <Label htmlFor="label">
              Label <span className="text-destructive">*</span>
            </Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Senior Python Developer"
              maxLength={30}
            />
            {errors.label && (
              <p className="text-xs text-destructive">{errors.label}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.label.length}/30 characters
            </p>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tooltip text (optional)"
            />
          </div>

          {/* Query Fragment Textarea */}
          <div className="space-y-2">
            <Label htmlFor="queryFragment">
              Query Fragment <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="queryFragment"
              value={formData.queryFragment}
              onChange={(e) =>
                setFormData({ ...formData, queryFragment: e.target.value })
              }
              placeholder='e.g., ("Python" AND "Senior")'
              rows={3}
            />
            {errors.queryFragment && (
              <p className="text-xs text-destructive">{errors.queryFragment}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use quotes for exact phrases, OR for alternatives, AND for required terms
            </p>
          </div>

          {/* Preview */}
          {formData.queryFragment.trim() && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-medium mb-1">Preview:</p>
              <code className="text-xs break-all">{formData.queryFragment}</code>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === "create" ? "Create" : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
