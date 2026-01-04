"use client"

import * as React from "react"
import { Play } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { AgentSessionConfig } from "@/lib/agent/types"
import {
  AGENT_DEFAULTS,
  DEFAULT_PERSONA_TEMPLATE,
  DEFAULT_SEED_QUERY_TEMPLATE,
  DEFAULT_SCORING_MASTER_PROMPT,
} from "@/config/agentDefaults"

interface AgentConfigPanelProps {
  onStart: (config: AgentSessionConfig) => void
  isRunning: boolean
  disabled?: boolean
}

/**
 * AgentConfigPanel - Configuration form for agent session
 *
 * Replaces UnifiedSearchForm when in agent mode. Allows users to configure:
 * - Target persona description
 * - Seed query for expansion
 * - Scoring thresholds (Pass 1 & Pass 2)
 * - Budget and concurrency limits
 */
export function AgentConfigPanel({
  onStart,
  isRunning,
  disabled = false,
}: AgentConfigPanelProps) {
  const [persona, setPersona] = React.useState<string>(DEFAULT_PERSONA_TEMPLATE)
  const [seedQuery, setSeedQuery] = React.useState<string>(DEFAULT_SEED_QUERY_TEMPLATE)
  const [pass1Threshold, setPass1Threshold] = React.useState<number>(AGENT_DEFAULTS.pass1Threshold)
  const [pass2Threshold, setPass2Threshold] = React.useState<number>(AGENT_DEFAULTS.pass2Threshold)
  const [queryBudget, setQueryBudget] = React.useState<number>(AGENT_DEFAULTS.queryBudgetPerRound)
  const [concurrency, setConcurrency] = React.useState<number>(AGENT_DEFAULTS.concurrencyLimit)
  const [maxResults, setMaxResults] = React.useState<number>(AGENT_DEFAULTS.maxResultsPerQuery)

  const handleStart = () => {
    const config: AgentSessionConfig = {
      persona: persona.trim(),
      seedQuery: seedQuery.trim(),
      scoringMasterPrompt: DEFAULT_SCORING_MASTER_PROMPT,
      pass1Threshold,
      pass2Threshold,
      queryBudgetPerRound: queryBudget,
      concurrencyLimit: concurrency,
      maxResultsPerQuery: maxResults,
    }
    onStart(config)
  }

  const isValid = persona.trim().length > 0 && seedQuery.trim().length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Pipeline Configuration</CardTitle>
        <CardDescription>
          Configure your agentic query generation session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Persona Section */}
        <div className="space-y-2">
          <Label htmlFor="persona">Target Persona</Label>
          <Textarea
            id="persona"
            placeholder="Describe your target ICP... (e.g., Series A CTOs in fintech)"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            rows={4}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Describe the target audience for lead generation (job titles, seniority, industry, location)
          </p>
        </div>

        {/* Seed Query Section */}
        <div className="space-y-2">
          <Label htmlFor="seedQuery">Seed Query</Label>
          <Input
            id="seedQuery"
            placeholder='site:linkedin.com/in/ CTO startup'
            value={seedQuery}
            onChange={(e) => setSeedQuery(e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Initial query to expand upon (LinkedIn search syntax)
          </p>
        </div>

        {/* Advanced Options Accordion */}
        <Accordion type="multiple" defaultValue={[]} className="w-full">
          {/* Thresholds Section */}
          <AccordionItem value="thresholds">
            <AccordionTrigger>Scoring Thresholds</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pass1Threshold">Pass 1 Threshold</Label>
                  <span className="text-sm font-medium text-muted-foreground">
                    {pass1Threshold}%
                  </span>
                </div>
                <input
                  id="pass1Threshold"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={pass1Threshold}
                  onChange={(e) => setPass1Threshold(Number(e.target.value))}
                  disabled={disabled}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum score for queries to proceed to Pass 2 validation
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pass2Threshold">Pass 2 Threshold</Label>
                  <span className="text-sm font-medium text-muted-foreground">
                    {pass2Threshold}%
                  </span>
                </div>
                <input
                  id="pass2Threshold"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={pass2Threshold}
                  onChange={(e) => setPass2Threshold(Number(e.target.value))}
                  disabled={disabled}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum score for queries to execute and fetch full results
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Limits Section */}
          <AccordionItem value="limits">
            <AccordionTrigger>Budget & Limits</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="queryBudget">Query Budget (per round)</Label>
                <Input
                  id="queryBudget"
                  type="number"
                  min="5"
                  max="100"
                  value={queryBudget}
                  onChange={(e) => setQueryBudget(Number(e.target.value))}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  Number of queries to generate in each round (5-100)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="concurrency">Concurrency Limit</Label>
                <Input
                  id="concurrency"
                  type="number"
                  min="1"
                  max="10"
                  value={concurrency}
                  onChange={(e) => setConcurrency(Number(e.target.value))}
                  disabled={disabled}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum parallel operations (1-10)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxResults">Max Results per Query</Label>
                <Select
                  value={maxResults.toString()}
                  onValueChange={(value) => setMaxResults(Number(value))}
                  disabled={disabled}
                >
                  <SelectTrigger id="maxResults">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="25">25 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                    <SelectItem value="100">100 results</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Maximum results to fetch per validated query
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={!isValid || isRunning || disabled}
          className="w-full"
          size="lg"
        >
          <Play className="mr-2 size-4" />
          Start Agent Pipeline
        </Button>
      </CardContent>
    </Card>
  )
}
