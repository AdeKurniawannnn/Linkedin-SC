"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MobileTabsProps {
  queryTab: React.ReactNode;
  resultsTab: React.ReactNode;
}

/**
 * MobileTabs Component
 *
 * A tabbed interface for mobile/tablet viewports (< 1024px).
 * Switches between "Build Query" and "Results" views.
 */
export function MobileTabs({ queryTab, resultsTab }: MobileTabsProps) {
  return (
    <Tabs defaultValue="query" className="flex-1 flex flex-col h-[calc(100vh-var(--header-height,64px))]">
      <TabsList className="grid w-full grid-cols-2 shrink-0">
        <TabsTrigger value="query">Build Query</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
      </TabsList>

      <TabsContent value="query" className="flex-1 overflow-y-auto px-4 py-4 m-0">
        {queryTab}
      </TabsContent>

      <TabsContent value="results" className="flex-1 overflow-y-auto px-4 py-4 m-0">
        {resultsTab}
      </TabsContent>
    </Tabs>
  );
}
