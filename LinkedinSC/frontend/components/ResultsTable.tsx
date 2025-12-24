"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Download, ChevronDown, ChevronUp, Globe, MapPin, Users, Calendar } from "lucide-react";
import type { LinkedInProfile, CompanyDetail } from "@/lib/api";
import { scrapeCompanyDetails } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

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
  const [scrapedData, setScrapedData] = useState<Map<number, CompanyDetail>>(new Map());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Determine if this is company data based on explicit dataType prop
  const isCompanyData = dataType === 'company';

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

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
            setScrapedData(prev => new Map(prev).set(index, company));
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
      const headers = ["No", "Scraped", "Nama Perusahaan", "Industri", "Followers", "Ukuran", "Tahun", "Lokasi", "Website", "Company URL", "Full Description"];
      const rows = profiles.map((p, index) => {
        const titleParts = p.title.split(' - ');
        const name = titleParts[0].trim();
        const scraped = scrapedData.get(index);

        return [
          index + 1,
          scraped ? "Yes" : "No",
          `"${name.replace(/"/g, '""')}"`,
          `"${(scraped?.industry || p.industry || "-").replace(/"/g, '""')}"`,
          scraped?.followers || p.followers || "-",
          `"${(scraped?.employee_count_range || p.company_size || "-").replace(/"/g, '""')}"`,
          scraped?.founded || p.founded_year || "-",
          `"${(scraped?.location || p.location || "-").replace(/"/g, '""')}"`,
          scraped?.website || "-",
          p.profile_url,
          `"${(scraped?.full_description || p.description || "-").replace(/"/g, '""')}"`,
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
                <TableHead className="w-16 text-center">No</TableHead>
                <TableHead className="w-16 text-center">Action</TableHead>
                <TableHead className="w-48">Nama {isCompanyData ? "Perusahaan" : ""}</TableHead>
                {isCompanyData ? (
                  <>
                    <TableHead className="w-40">Industri</TableHead>
                    <TableHead className="w-24 text-right">Followers</TableHead>
                    <TableHead className="w-28">Ukuran</TableHead>
                    <TableHead className="w-40">Lokasi</TableHead>
                    <TableHead className="w-16 text-center">Info</TableHead>
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
                const isExpanded = expandedRows.has(index);

                return (
                  <>
                    <TableRow
                      key={index}
                      className={`hover:bg-gray-50 transition-colors ${isScraped ? 'bg-blue-50/30' : ''}`}
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
                        <div className="flex flex-col">
                          <a
                            href={profile.profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px]"
                          >
                            {isScraped ? scraped.name : name}
                          </a>
                          {isScraped && scraped.tagline && (
                            <span className="text-xs text-gray-500 italic truncate max-w-[200px]">
                              {scraped.tagline}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      {isCompanyData ? (
                        <>
                          <TableCell>
                            <div className="text-sm text-gray-700">
                              {scraped?.industry || profile.industry || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-sm text-gray-700 font-medium">
                              {scraped?.followers || (profile.followers ? profile.followers.toLocaleString() : '-')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700">
                              {scraped?.employee_count_range || profile.company_size || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700">
                              {scraped?.location || profile.location || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => toggleRow(index)}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
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
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {profile.description || '-'}
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                    
                    {/* Expanded Detail Row */}
                    {isExpanded && (
                      <TableRow className="bg-gray-50/50">
                        <TableCell colSpan={isCompanyData ? 8 : 5} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="md:col-span-2 space-y-4">
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center">
                                  About
                                  {isScraped && <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 text-[10px] h-4">Scraped</Badge>}
                                </h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {isScraped ? (scraped.full_description || scraped.about) : profile.description}
                                </p>
                              </div>
                              
                              {isScraped && scraped.specialties && scraped.specialties.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Specialties</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {scraped.specialties.map((s, i) => (
                                      <Badge key={i} variant="outline" className="text-[11px] font-normal">
                                        {s}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-gray-900">Company Info</h4>
                              <div className="space-y-3">
                                {isScraped && scraped.website && (
                                  <div className="flex items-start gap-2">
                                    <Globe className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div className="flex flex-col">
                                      <span className="text-[11px] text-gray-400 uppercase font-bold">Website</span>
                                      <a href={scraped.website.startsWith('http') ? scraped.website : `https://${scraped.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                                        {scraped.website}
                                      </a>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                  <div className="flex flex-col">
                                    <span className="text-[11px] text-gray-400 uppercase font-bold">Headquarters</span>
                                    <span className="text-sm text-gray-600">{scraped?.location || profile.location || '-'}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                  <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                                  <div className="flex flex-col">
                                    <span className="text-[11px] text-gray-400 uppercase font-bold">Company Size</span>
                                    <span className="text-sm text-gray-600">{scraped?.employee_count_range || profile.company_size || '-'}</span>
                                  </div>
                                </div>
                                
                                {(scraped?.founded || profile.founded_year) && (
                                  <div className="flex items-start gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div className="flex flex-col">
                                      <span className="text-[11px] text-gray-400 uppercase font-bold">Founded</span>
                                      <span className="text-sm text-gray-600">{scraped?.founded || profile.founded_year}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {isScraped && (
                                <div className="pt-4 border-t mt-4">
                                  <span className="text-[10px] text-gray-400 italic">
                                    Last scraped: {new Date(scraped.scraped_at).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
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
