"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import type { SiteFilterType } from "@/stores/queryBuilderStore";

/**
 * SiteFilter Component
 *
 * Komponen untuk memilih tipe konten LinkedIn yang ingin dicari.
 * Terintegrasi dengan Zustand store untuk state management.
 *
 * Features:
 * - 5 toggle buttons (All, Profile, Posts, Jobs, Company)
 * - Active state visual feedback
 * - Real-time query string updates
 * - Responsive layout (mobile & desktop)
 *
 * Based on research findings from LINKEDIN_URL_PATTERNS.md:
 * - Profile: 95%+ success rate (Priority HIGH)
 * - Posts: 80%+ success rate (Priority MEDIUM)
 * - Jobs: 70%+ success rate (Priority MEDIUM)
 * - Company: 60%+ success rate (Priority MEDIUM)
 */
export function SiteFilter() {
  // Zustand store integration
  const siteFilter = useQueryBuilderStore((state) => state.siteFilter);
  const setSiteFilter = useQueryBuilderStore((state) => state.setSiteFilter);

  // Site filter options dengan label dan description
  const siteFilterOptions: { value: SiteFilterType; label: string; description: string }[] = [
    {
      value: 'all',
      label: 'Semua',
      description: 'Semua hasil LinkedIn (tanpa filter spesifik)'
    },
    {
      value: 'profile',
      label: 'Profil',
      description: 'Profil pengguna LinkedIn (95%+ akurat)'
    },
    {
      value: 'posts',
      label: 'Postingan',
      description: 'Postingan & feed LinkedIn (80%+ akurat)'
    },
    {
      value: 'jobs',
      label: 'Lowongan',
      description: 'Lowongan pekerjaan LinkedIn (70%+ akurat)'
    },
    {
      value: 'company',
      label: 'Perusahaan',
      description: 'Halaman perusahaan LinkedIn (60%+ akurat)'
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Tipe LinkedIn</CardTitle>
        <CardDescription>
          Pilih tipe konten LinkedIn yang ingin dicari
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle Button Group */}
        <div className="flex flex-wrap gap-2">
          {siteFilterOptions.map((option) => (
            <Button
              key={option.value}
              variant={siteFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSiteFilter(option.value)}
              className="flex-1 min-w-[100px]"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Helper text showing selected filter description */}
        <p className="text-xs text-gray-500">
          {siteFilterOptions.find((o) => o.value === siteFilter)?.description}
        </p>
      </CardContent>
    </Card>
  );
}
