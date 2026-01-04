# Agent UI Components

Configuration panel and control components for the Agentic Query Builder UI.

## Overview

This directory contains the core UI components for the agent mode interface, which replaces the standard search form when users activate agent mode. The components work together to provide a complete pipeline configuration and monitoring experience.

## Components

### 1. AgentModeToggle.tsx

Simple toggle switch to enable/disable Agent Mode.

**Props:**
```typescript
interface AgentModeToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}
```

**Features:**
- Compact design for header placement
- Sparkles icon indicator
- Smooth state transitions
- Keyboard accessible

**Usage:**
```tsx
import { AgentModeToggle } from "@/components/agent"

<AgentModeToggle
  checked={isAgentMode}
  onChange={setAgentMode}
/>
```

---

### 2. AgentConfigPanel.tsx

Configuration form for agent session (replaces UnifiedSearchForm when in agent mode).

**Props:**
```typescript
interface AgentConfigPanelProps {
  onStart: (config: AgentSessionConfig) => void
  isRunning: boolean
  disabled?: boolean
}
```

**Features:**
- **Persona Section**: Textarea for target ICP description
- **Seed Query Section**: Input for initial LinkedIn search query
- **Thresholds Section** (collapsible):
  - Pass 1 Threshold: Slider 0-100% (default 70%)
  - Pass 2 Threshold: Slider 0-100% (default 60%)
- **Limits Section** (collapsible):
  - Query Budget: Number input 5-100 (default 10)
  - Concurrency: Number input 1-10 (default 5)
  - Max Results per Query: Select 10/25/50/100 (default 100)
- **Start Button**: Primary action with validation

**Validation:**
- Persona must not be empty
- Seed query must not be empty
- All numeric inputs have min/max constraints

**Usage:**
```tsx
import { AgentConfigPanel } from "@/components/agent"

<AgentConfigPanel
  onStart={handleStartPipeline}
  isRunning={isRunning}
/>
```

---

### 3. AgentControls.tsx

Pipeline control buttons for pausing, resuming, stopping, and generating more.

**Props:**
```typescript
interface AgentControlsProps {
  isRunning: boolean
  isPaused: boolean
  currentStage: PipelineStage
  currentRound: number
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onGenerateMore: () => void
}
```

**Features:**
- **Round Badge**: Shows current round number
- **Pause/Resume Button**: Toggle pipeline execution
- **Stop Button**: With confirmation dialog for safety
- **Generate More Button**: Enabled only when round completes

**Button Variants:**
- Pause/Resume: Outline variant
- Stop: Destructive variant with confirmation
- Generate More: Primary variant

**Usage:**
```tsx
import { AgentControls } from "@/components/agent"

<AgentControls
  isRunning={isRunning}
  isPaused={isPaused}
  currentStage={currentStage}
  currentRound={currentRound}
  onPause={handlePause}
  onResume={handleResume}
  onStop={handleStop}
  onGenerateMore={handleGenerateMore}
/>
```

---

### 4. AgentProgressBar.tsx

Stage progress indicator with visual feedback.

**Props:**
```typescript
interface AgentProgressBarProps {
  stage: PipelineStage
  progress: {
    current: number
    total: number
    message?: string
  }
  className?: string
}
```

**Features:**
- Stage name label from `PIPELINE_STAGE_LABELS`
- Animated progress bar (shadcn/ui Progress component)
- Progress text with current/total counts
- Optional status message
- Percentage display
- Idle state handling

**Stage Labels:**
- `idle`: "No active pipeline operations"
- `generating`: "Generating Queries"
- `pass1`: "Pass 1: Scoring Potential"
- `pass2`: "Pass 2: Validating Results"
- `executing`: "Executing Queries"

**Usage:**
```tsx
import { AgentProgressBar } from "@/components/agent"

<AgentProgressBar
  stage={currentStage}
  progress={{
    current: 18,
    total: 38,
    message: "Scoring queries"
  }}
/>
```

---

## Dependencies

### UI Components (shadcn/ui)
- `Button` - Action buttons with variants
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` - Layout containers
- `Input` - Text input fields
- `Textarea` - Multi-line text input
- `Label` - Form labels
- `Switch` - Toggle switch
- `Select` - Dropdown selection
- `Accordion` - Collapsible sections
- `Progress` - Progress bar indicator
- `Badge` - Status badges
- `AlertDialog` - Confirmation dialogs

### Icons (lucide-react)
- `Sparkles` - Agent mode indicator
- `Play` - Start/resume actions
- `Pause` - Pause action
- `Square` - Stop action
- `Plus` - Generate more action

### Types & Utilities
- `@/lib/agent/types` - Type definitions
- `@/config/agentDefaults` - Default configurations
- `@/stores/agentSessionStore` - Runtime state management
- `@/lib/utils` - cn() utility for classnames

---

## Styling

All components follow the existing design system:

- **Colors**: Uses theme variables (primary, muted, destructive, etc.)
- **Spacing**: Consistent gap/padding from design tokens
- **Typography**: Matches existing font sizes and weights
- **Shadows**: Uses shadow-xs for subtle elevation
- **Borders**: Rounded corners with border utilities
- **Dark Mode**: Fully supported via theme variables

**Key Patterns:**
```tsx
// Slider styling (custom range input)
className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"

// Muted text
className="text-sm text-muted-foreground"

// Card spacing
className="space-y-6"

// Form field spacing
className="space-y-2"
```

---

## Integration Example

```tsx
"use client"

import { useState } from "react"
import {
  AgentModeToggle,
  AgentConfigPanel,
  AgentControls,
  AgentProgressBar,
} from "@/components/agent"
import { useAgentSessionStore } from "@/stores/agentSessionStore"

export function AgentInterface() {
  const [isAgentMode, setAgentMode] = useState(false)
  const {
    isRunning,
    isPaused,
    currentStage,
    progress,
    setRunning,
    setPaused,
  } = useAgentSessionStore()

  const handleStart = (config) => {
    console.log("Starting pipeline with config:", config)
    setRunning(true)
    // Call Convex mutation to start pipeline
  }

  const handlePause = () => setPaused(true)
  const handleResume = () => setPaused(false)
  const handleStop = () => setRunning(false)
  const handleGenerateMore = () => {
    console.log("Generating more queries...")
  }

  return (
    <div className="space-y-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h1>LinkedIn Search</h1>
        <AgentModeToggle
          checked={isAgentMode}
          onChange={setAgentMode}
        />
      </div>

      {/* Config panel or controls */}
      {isAgentMode && (
        <>
          {!isRunning ? (
            <AgentConfigPanel
              onStart={handleStart}
              isRunning={isRunning}
            />
          ) : (
            <>
              <AgentControls
                isRunning={isRunning}
                isPaused={isPaused}
                currentStage={currentStage}
                currentRound={1}
                onPause={handlePause}
                onResume={handleResume}
                onStop={handleStop}
                onGenerateMore={handleGenerateMore}
              />
              <AgentProgressBar
                stage={currentStage}
                progress={progress}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
```

---

## State Management

Components integrate with `useAgentSessionStore` for runtime state:

```typescript
// Store state
{
  activeSessionId: string | null
  isRunning: boolean
  isPaused: boolean
  currentStage: PipelineStage
  progress: ProgressState
  pipelineStats: PipelineStats
  config: AgentSessionConfig | null
}

// Store actions
{
  setRunning(isRunning: boolean): void
  setPaused(isPaused: boolean): void
  setStage(stage: PipelineStage): void
  updateProgress(progress: Partial<ProgressState>): void
  updateStats(stats: Partial<PipelineStats>): void
}
```

---

## Accessibility

All components follow WCAG 2.1 AA standards:

- ✅ Keyboard navigation support
- ✅ Screen reader labels
- ✅ Focus indicators (ring-[3px])
- ✅ Color contrast ratios
- ✅ Semantic HTML structure
- ✅ ARIA attributes where needed
- ✅ Disabled states properly communicated

---

## Testing Considerations

When testing these components:

1. **AgentModeToggle**
   - Toggle state changes
   - Disabled state prevents interaction
   - Keyboard accessibility (Space/Enter)

2. **AgentConfigPanel**
   - Form validation (empty persona/query)
   - Slider value updates
   - Number input constraints
   - Accordion expand/collapse
   - Start button disabled states

3. **AgentControls**
   - Pause/Resume toggle
   - Stop confirmation dialog
   - Generate More visibility
   - Round badge updates

4. **AgentProgressBar**
   - Progress percentage calculation
   - Stage label updates
   - Message display
   - Idle state rendering

---

## Future Enhancements

Potential improvements:

1. **AgentConfigPanel**
   - Preset configurations (save/load)
   - Advanced LLM settings
   - Custom scoring criteria editor
   - Query templates library

2. **AgentProgressBar**
   - Estimated time remaining
   - Stage-specific icons
   - Animation improvements
   - Mini sparklines for stats

3. **AgentControls**
   - Export results button
   - Retry failed queries
   - Skip to next stage
   - Custom webhook triggers

4. **General**
   - Tooltips for all controls
   - Keyboard shortcuts
   - Mobile-optimized layouts
   - Real-time collaboration features

---

## File Structure

```
components/agent/
├── index.ts                 # Barrel exports
├── AgentModeToggle.tsx      # Toggle switch
├── AgentConfigPanel.tsx     # Configuration form
├── AgentControls.tsx        # Control buttons
├── AgentProgressBar.tsx     # Progress indicator
└── README.md                # This file
```

---

## Contributing

When adding new agent components:

1. Follow existing naming conventions (`Agent[Feature]`)
2. Use shadcn/ui primitives for consistency
3. Import types from `@/lib/agent/types`
4. Import defaults from `@/config/agentDefaults`
5. Add exports to `index.ts`
6. Update this README with usage examples
7. Ensure dark mode compatibility
8. Test keyboard navigation
9. Add TypeScript JSDoc comments
