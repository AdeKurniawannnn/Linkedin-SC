"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Download } from "lucide-react";
import type { LinkedInProfile } from "@/lib/api";
import { scrapeCompanyDetails } from "@/lib/api";

type SiteFilterType = 'all' | 'profile' | 'posts' | 'jobs' | 'company';

interface ResultsTableProps {
  profiles: LinkedInProfile[];
  metadata?: {
    country: string;
    language: string;
    pages_fetched: number;
    search_engine: string;
    has_errors: boolean;
  };
  dataType?: SiteFilterType;  // Explicit data type from query builder
}

export function ResultsTable({ profiles, metadata, dataType = 'profile' }: ResultsTableProps) {
  // State untuk tracking checkbox selection
  const [selectedProfiles, setSelectedProfiles] = useState<Set<number>>(new Set());

  // State untuk tracking scraping progress
  const [scrapingInProgress, setScrapingInProgress] = useState(false);
  const [scrapedData, setScrapedData] = useState<Map<number, any>>(new Map());

  // Determine if this is company data based on explicit dataType prop
  const isCompanyData = dataType === 'company';

  const handleToggle = (index: number) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProfiles(newSelected);
  };

  const handleScrapeSelected = async () => {
    console.log('🔍 [SCRAPE] Button clicked! Selected:', selectedProfiles.size);

    if (selectedProfiles.size === 0) {
      console.log('⚠️ [SCRAPE] No companies selected');
      alert('Pilih minimal 1 company untuk di-scrape');
      return;
    }

    console.log('✅ [SCRAPE] Starting scrape for', selectedProfiles.size, 'companies');
    setScrapingInProgress(true);

    try {
      // Get selected profile URLs
      const selectedURLs = Array.from(selectedProfiles).map(index => ({
        index,
        url: profiles[index].profile_url,
        name: profiles[index].title.split(' - ')[0].trim()
      }));

      console.log('📋 [SCRAPE] URLs to scrape:', selectedURLs);

      // Call backend API to scrape using Crawl4AI
      const urls = selectedURLs.map(item => item.url);
      console.log('🌐 [SCRAPE] Calling backend API with URLs:', urls);

      const result = await scrapeCompanyDetails(urls);
      console.log('✅ [SCRAPE] Backend response:', result);

      if (result.success) {
        // Map scraped data back to indices
        const urlToIndexMap = new Map(selectedURLs.map(item => [item.url, item.index]));

        for (const company of result.companies) {
          const index = urlToIndexMap.get(company.url);
          if (index !== undefined) {
            const scrapedData = {
              fullDescription: company.full_description || `Scraped from ${company.name}`,
              specialties: company.specialties || [],
              employeeCount: company.employee_count,
              scrapedAt: company.scraped_at
            };

            setScrapedData(prev => new Map(prev).set(index, scrapedData));
            console.log(`✅ [SCRAPE] Scraped ${company.name} successfully`);
          }
        }

        console.log(`🎉 [SCRAPE] All done! Scraped ${result.total_scraped}/${selectedProfiles.size} companies`);
        alert(`✅ Scraping selesai!\n\nBerhasil: ${result.metadata.successful}\nGagal: ${result.metadata.failed}\nWaktu: ${result.metadata.time_taken_seconds}s`);
      } else {
        throw new Error('Scraping failed');
      }
    } catch (error) {
      console.error('❌ [SCRAPE] Error:', error);
      alert('❌ Scraping gagal. Coba lagi.');
    } finally {
      console.log('🏁 [SCRAPE] Cleanup - setting scrapingInProgress = false');
      setScrapingInProgress(false);
    }
  };

  const handleExportCSV = () => {
    // Different CSV structure for company vs profile
    if (isCompanyData) {
      // Company CSV
      const headers = ["No", "Scraped", "Nama Perusahaan", "Industri", "Followers", "Ukuran", "Tahun", "Lokasi", "Tipe", "Headquarters", "Rank", "Frequency", "Pages Seen", "Company URL", "Full Description"];
      const rows = profiles.map((p, index) => {
        const titleParts = p.title.split(' - ');
        const name = titleParts[0].trim();
        const scraped = scrapedData.get(index);

        return [
          index + 1,
          scraped ? "Yes" : "No",
          `"${name.replace(/"/g, '""')}"`,
          `"${(p.industry || "-").replace(/"/g, '""')}"`,
          scraped && scraped.employeeCount ? scraped.employeeCount : (p.followers || "-"),
          `"${(p.company_size || "-").replace(/"/g, '""')}"`,
          p.founded_year || "-",
          `"${(p.location || "-").replace(/"/g, '""')}"`,
          `"${(p.company_type || "-").replace(/"/g, '""')}"`,
          `"${(p.headquarters || "-").replace(/"/g, '""')}"`,
          p.rank || "-",
          p.frequency || "-",
          `"${p.pages_seen.join(", ")}"`,
          p.profile_url,
          scraped ? `"${scraped.fullDescription.replace(/"/g, '""')}"` : `"${(p.description || "-").replace(/"/g, '""')}"`,
        ];
      });

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `linkedin-companies-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Profile CSV
      const headers = ["No", "Selected", "Nama", "Pekerjaan", "Description", "Profile URL"];
      const rows = profiles.map((p, index) => {
        const titleParts = p.title.split(' - ');
        const name = titleParts[0].trim();
        const headline = titleParts.slice(1).join(' - ').trim();

        return [
          index + 1,
          selectedProfiles.has(index) ? "Yes" : "No",
          `"${name.replace(/"/g, '""')}"`,
          `"${headline.replace(/"/g, '""')}"`,
          `"${(p.description || "").replace(/"/g, '""')}"`,
          p.profile_url,
        ];
      });

      const csv = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `linkedin-profiles-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (profiles.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-6xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Search Results</CardTitle>
          <CardDescription>
            Found {profiles.length} LinkedIn {isCompanyData ? "companies" : "profiles"}
            {metadata && (
              <>
                {" • "}
                {metadata.pages_fetched} pages fetched via {metadata.search_engine}
              </>
            )}
            {selectedProfiles.size > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedProfiles.size} selected)
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {isCompanyData && (
            <Button
              onClick={handleScrapeSelected}
              disabled={scrapingInProgress || selectedProfiles.size === 0}
              variant="default"
            >
              {scrapingInProgress ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Scraping...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Scrape Selected ({selectedProfiles.size})
                </>
              )}
            </Button>
          )}
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">No</TableHead>
                <TableHead className="w-16 text-center">Toggle</TableHead>
                <TableHead className="w-48">Nama {isCompanyData ? "Perusahaan" : ""}</TableHead>
                {isCompanyData ? (
                  <>
                    <TableHead className="w-40">Industri</TableHead>
                    <TableHead className="w-24 text-right">Followers</TableHead>
                    <TableHead className="w-28">Ukuran</TableHead>
                    <TableHead className="w-20 text-center">Tahun</TableHead>
                    <TableHead className="w-40">Lokasi</TableHead>
                    <TableHead className="w-32">Tipe</TableHead>
                    <TableHead className="w-20 text-center">Rank</TableHead>
                    <TableHead className="w-24 text-center">Frequency</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="w-64">Pekerjaan</TableHead>
                    <TableHead>Description</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile, index) => {
                // Parse name dari title
                const titleParts = profile.title.split(' - ');
                const name = titleParts[0].trim();
                const headline = titleParts.slice(1).join(' - ').trim();
                const scraped = scrapedData.get(index);
                const isScraped = scraped !== undefined;

                return (
                  <>
                    <TableRow
                      key={index}
                      className={`hover:bg-gray-50 ${isScraped ? 'bg-green-50' : ''}`}
                    >
                      <TableCell className="font-medium text-center">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedProfiles.has(index)}
                          onCheckedChange={() => handleToggle(index)}
                        />
                      </TableCell>
                      <TableCell>
                        <a
                          href={profile.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {name}
                        </a>
                      </TableCell>
                      {isCompanyData ? (
                        <>
                          <TableCell>
                            <div className="text-sm text-gray-700">
                              {profile.industry || '-'}
                            </div>
                            {isScraped && scraped.specialties && (
                              <div className="text-xs text-green-600 mt-1">
                                ✓ {scraped.specialties.join(', ')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-sm text-gray-700 font-medium">
                              {isScraped && scraped.employeeCount
                                ? scraped.employeeCount.toLocaleString()
                                : profile.followers !== null
                                ? profile.followers.toLocaleString()
                                : '-'}
                            </div>
                            {isScraped && (
                              <div className="text-xs text-green-600 mt-1">✓ Updated</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700">
                              {profile.company_size || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-sm text-gray-700">
                              {profile.founded_year || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700">
                              {profile.location || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700">
                              {profile.company_type || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-sm text-gray-700 font-medium">
                              {profile.rank || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="text-sm text-gray-700 font-medium">
                              {profile.frequency || '-'}
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <div className="text-sm text-gray-700">
                              {headline || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {profile.description ? (
                              <div className="text-sm text-gray-600 line-clamp-2">
                                {profile.description}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
