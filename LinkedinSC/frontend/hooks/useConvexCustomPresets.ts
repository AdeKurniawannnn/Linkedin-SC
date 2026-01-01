"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import type { PresetCategory } from "@/config/queryPresets";

export interface CustomPresetInput {
  category: PresetCategory | "custom";
  label: string;
  description: string;
  queryFragment: string;
}

/**
 * Hook for Convex-backed custom presets
 * Provides real-time sync and persistent storage
 */
export function useConvexCustomPresets() {
  // Queries
  const presets = useQuery(api.customPresets.list);

  // Mutations
  const addMutation = useMutation(api.customPresets.add);
  const updateMutation = useMutation(api.customPresets.update);
  const removeMutation = useMutation(api.customPresets.remove);

  // Add preset
  const addPreset = async (preset: CustomPresetInput) => {
    try {
      const id = await addMutation(preset);
      toast.success("Preset created", { description: preset.label });
      return id;
    } catch (error) {
      console.error("Failed to create preset:", error);
      toast.error("Failed to create preset");
      return null;
    }
  };

  // Update preset
  const updatePreset = async (
    id: Id<"customPresets">,
    updates: Partial<CustomPresetInput>
  ) => {
    try {
      await updateMutation({ id, ...updates });
      toast.success("Preset updated");
    } catch (error) {
      console.error("Failed to update preset:", error);
      toast.error("Failed to update preset");
    }
  };

  // Delete preset
  const deletePreset = async (id: Id<"customPresets">) => {
    try {
      await removeMutation({ id });
      toast.success("Preset deleted");
    } catch (error) {
      console.error("Failed to delete preset:", error);
      toast.error("Failed to delete preset");
    }
  };

  // Get presets by category
  const getPresetsByCategory = (category: PresetCategory | "custom") => {
    if (!presets) return [];
    return presets.filter(
      (preset) => preset.category === category || preset.category === "custom"
    );
  };

  // Get preset by ID
  const getPresetById = (id: Id<"customPresets">) => {
    return presets?.find((preset) => preset._id === id);
  };

  return {
    // State
    presets: presets ?? [],
    isLoading: presets === undefined,

    // Actions
    addPreset,
    updatePreset,
    deletePreset,
    getPresetsByCategory,
    getPresetById,
  };
}
