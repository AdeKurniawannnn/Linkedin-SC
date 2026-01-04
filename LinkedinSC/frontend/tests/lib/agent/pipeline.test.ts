import { describe, it, expect } from 'vitest'
import {
  type PipelineStage,
  type PipelineState,
  createInitialState,
  canTransition,
  transition,
  getNextStage,
  isTerminalStage,
  pipelineStageToSessionStatus,
  sessionStatusToPipelineStage,
} from '@/lib/agent/pipeline'

describe('pipeline state machine', () => {
  describe('createInitialState', () => {
    it('returns correct initial state', () => {
      const state = createInitialState()

      expect(state.stage).toBe('idle')
      expect(state.round).toBe(0)
      expect(state.queriesGenerated).toEqual([])
      expect(state.pass1Queue).toEqual([])
      expect(state.pass1Completed).toEqual([])
      expect(state.pass2Queue).toEqual([])
      expect(state.pass2Completed).toEqual([])
      expect(state.executeQueue).toEqual([])
      expect(state.executeCompleted).toEqual([])
      expect(state.error).toBeUndefined()
    })
  })

  describe('canTransition', () => {
    describe('valid transitions', () => {
      it('idle -> generating', () => {
        expect(canTransition('idle', 'generating')).toBe(true)
      })

      it('generating -> pass1', () => {
        expect(canTransition('generating', 'pass1')).toBe(true)
      })

      it('generating -> error', () => {
        expect(canTransition('generating', 'error')).toBe(true)
      })

      it('pass1 -> pass2', () => {
        expect(canTransition('pass1', 'pass2')).toBe(true)
      })

      it('pass1 -> error', () => {
        expect(canTransition('pass1', 'error')).toBe(true)
      })

      it('pass2 -> executing', () => {
        expect(canTransition('pass2', 'executing')).toBe(true)
      })

      it('pass2 -> error', () => {
        expect(canTransition('pass2', 'error')).toBe(true)
      })

      it('executing -> aggregating', () => {
        expect(canTransition('executing', 'aggregating')).toBe(true)
      })

      it('executing -> error', () => {
        expect(canTransition('executing', 'error')).toBe(true)
      })

      it('aggregating -> complete', () => {
        expect(canTransition('aggregating', 'complete')).toBe(true)
      })

      it('aggregating -> generating (next round)', () => {
        expect(canTransition('aggregating', 'generating')).toBe(true)
      })

      it('aggregating -> error', () => {
        expect(canTransition('aggregating', 'error')).toBe(true)
      })

      it('complete -> generating (restart)', () => {
        expect(canTransition('complete', 'generating')).toBe(true)
      })

      it('complete -> idle (reset)', () => {
        expect(canTransition('complete', 'idle')).toBe(true)
      })

      it('error -> idle (reset)', () => {
        expect(canTransition('error', 'idle')).toBe(true)
      })

      it('error -> generating (retry)', () => {
        expect(canTransition('error', 'generating')).toBe(true)
      })
    })

    describe('invalid transitions', () => {
      it('idle -> complete (must go through pipeline)', () => {
        expect(canTransition('idle', 'complete')).toBe(false)
      })

      it('generating -> complete (must go through pipeline)', () => {
        expect(canTransition('generating', 'complete')).toBe(false)
      })

      it('executing -> complete (must go through aggregating)', () => {
        expect(canTransition('executing', 'complete')).toBe(false)
      })

      it('pass1 -> executing (must go through pass2)', () => {
        expect(canTransition('pass1', 'executing')).toBe(false)
      })

      it('pass2 -> complete (must go through executing and aggregating)', () => {
        expect(canTransition('pass2', 'complete')).toBe(false)
      })

      it('idle -> pass1 (must start with generating)', () => {
        expect(canTransition('idle', 'pass1')).toBe(false)
      })

      it('complete -> pass2 (must restart from generating)', () => {
        expect(canTransition('complete', 'pass2')).toBe(false)
      })
    })
  })

  describe('transition', () => {
    it('performs valid transition', () => {
      const state = createInitialState()
      const newState = transition(state, 'generating')

      expect(newState.stage).toBe('generating')
      expect(newState.round).toBe(0)
    })

    it('throws on invalid transition', () => {
      const state = createInitialState()

      expect(() => transition(state, 'complete')).toThrow(
        'Invalid pipeline transition: idle -> complete'
      )
    })

    it('includes valid transitions in error message', () => {
      const state = createInitialState()

      expect(() => transition(state, 'pass1')).toThrow('Valid transitions: generating')
    })

    it('sets error when transitioning to error state', () => {
      const state = { ...createInitialState(), stage: 'generating' as PipelineStage }
      const newState = transition(state, 'error', 'Something went wrong')

      expect(newState.stage).toBe('error')
      expect(newState.error).toBe('Something went wrong')
    })

    it('clears error when leaving error state', () => {
      const state: PipelineState = {
        ...createInitialState(),
        stage: 'error',
        error: 'Previous error',
      }
      const newState = transition(state, 'idle')

      expect(newState.stage).toBe('idle')
      expect(newState.error).toBeUndefined()
    })

    it('increments round and resets queues when starting new round from aggregating', () => {
      const state: PipelineState = {
        ...createInitialState(),
        stage: 'aggregating',
        round: 1,
        queriesGenerated: ['q1', 'q2'],
        pass1Queue: ['q1'],
        pass1Completed: ['q2'],
        pass2Queue: [],
        pass2Completed: ['q2'],
        executeQueue: [],
        executeCompleted: ['q2'],
      }

      const newState = transition(state, 'generating')

      expect(newState.round).toBe(2)
      expect(newState.queriesGenerated).toEqual([])
      expect(newState.pass1Queue).toEqual([])
      expect(newState.pass1Completed).toEqual([])
      expect(newState.pass2Queue).toEqual([])
      expect(newState.pass2Completed).toEqual([])
      expect(newState.executeQueue).toEqual([])
      expect(newState.executeCompleted).toEqual([])
    })

    it('increments round when transitioning from complete to generating', () => {
      const state: PipelineState = {
        ...createInitialState(),
        stage: 'complete',
        round: 1,
      }

      const newState = transition(state, 'generating')

      // Round should increment when starting new round from complete
      expect(newState.round).toBe(2)
    })
  })

  describe('getNextStage', () => {
    it('returns pass1 after generating with queries', () => {
      const state: PipelineState = {
        ...createInitialState(),
        stage: 'generating',
        queriesGenerated: ['q1', 'q2'],
      }

      expect(getNextStage(state)).toBe('pass1')
    })

    it('returns null after generating with no queries', () => {
      const state: PipelineState = {
        ...createInitialState(),
        stage: 'generating',
        queriesGenerated: [],
      }

      expect(getNextStage(state)).toBeNull()
    })

    it('returns pass2 after pass1 completes', () => {
      const state: PipelineState = {
        ...createInitialState(),
        stage: 'pass1',
        pass1Queue: [],
        pass1Completed: ['q1', 'q2'],
      }

      expect(getNextStage(state)).toBe('pass2')
    })

    it('returns null during pass1 with pending queue', () => {
      const state: PipelineState = {
        ...createInitialState(),
        stage: 'pass1',
        pass1Queue: ['q1'],
        pass1Completed: ['q2'],
      }

      expect(getNextStage(state)).toBeNull()
    })

    it('returns executing after pass2 completes', () => {
      const state: PipelineState = {
        ...createInitialState(),
        stage: 'pass2',
        pass2Queue: [],
        pass2Completed: ['q1'],
      }

      expect(getNextStage(state)).toBe('executing')
    })

    it('returns aggregating after executing completes', () => {
      const state: PipelineState = {
        ...createInitialState(),
        stage: 'executing',
        executeQueue: [],
        executeCompleted: ['q1'],
      }

      expect(getNextStage(state)).toBe('aggregating')
    })

    it('returns complete from aggregating', () => {
      const state: PipelineState = {
        ...createInitialState(),
        stage: 'aggregating',
      }

      expect(getNextStage(state)).toBe('complete')
    })

    it('returns null for terminal stages', () => {
      expect(getNextStage({ ...createInitialState(), stage: 'complete' })).toBeNull()
      expect(getNextStage({ ...createInitialState(), stage: 'idle' })).toBeNull()
      expect(getNextStage({ ...createInitialState(), stage: 'error' })).toBeNull()
    })
  })

  describe('isTerminalStage', () => {
    it('returns true for complete', () => {
      expect(isTerminalStage('complete')).toBe(true)
    })

    it('returns true for idle', () => {
      expect(isTerminalStage('idle')).toBe(true)
    })

    it('returns true for error', () => {
      expect(isTerminalStage('error')).toBe(true)
    })

    it('returns false for non-terminal stages', () => {
      expect(isTerminalStage('generating')).toBe(false)
      expect(isTerminalStage('pass1')).toBe(false)
      expect(isTerminalStage('pass2')).toBe(false)
      expect(isTerminalStage('executing')).toBe(false)
      expect(isTerminalStage('aggregating')).toBe(false)
    })
  })

  describe('pipelineStageToSessionStatus', () => {
    it('maps idle to idle', () => {
      expect(pipelineStageToSessionStatus('idle')).toBe('idle')
    })

    it('maps generating to generating', () => {
      expect(pipelineStageToSessionStatus('generating')).toBe('generating')
    })

    it('maps pass1 to pass1_scoring', () => {
      expect(pipelineStageToSessionStatus('pass1')).toBe('pass1_scoring')
    })

    it('maps pass2 to pass2_validating', () => {
      expect(pipelineStageToSessionStatus('pass2')).toBe('pass2_validating')
    })

    it('maps executing to executing', () => {
      expect(pipelineStageToSessionStatus('executing')).toBe('executing')
    })

    it('maps aggregating to executing', () => {
      expect(pipelineStageToSessionStatus('aggregating')).toBe('executing')
    })

    it('maps complete to completed', () => {
      expect(pipelineStageToSessionStatus('complete')).toBe('completed')
    })

    it('maps error to error', () => {
      expect(pipelineStageToSessionStatus('error')).toBe('error')
    })
  })

  describe('sessionStatusToPipelineStage', () => {
    it('maps idle to idle', () => {
      expect(sessionStatusToPipelineStage('idle')).toBe('idle')
    })

    it('maps generating to generating', () => {
      expect(sessionStatusToPipelineStage('generating')).toBe('generating')
    })

    it('maps pass1_scoring to pass1', () => {
      expect(sessionStatusToPipelineStage('pass1_scoring')).toBe('pass1')
    })

    it('maps pass2_validating to pass2', () => {
      expect(sessionStatusToPipelineStage('pass2_validating')).toBe('pass2')
    })

    it('maps executing to executing', () => {
      expect(sessionStatusToPipelineStage('executing')).toBe('executing')
    })

    it('maps completed to complete', () => {
      expect(sessionStatusToPipelineStage('completed')).toBe('complete')
    })

    it('maps error to error', () => {
      expect(sessionStatusToPipelineStage('error')).toBe('error')
    })

    it('maps paused to idle', () => {
      expect(sessionStatusToPipelineStage('paused')).toBe('idle')
    })
  })

  describe('full pipeline flow', () => {
    it('completes full pipeline with correct transitions', () => {
      let state = createInitialState()

      // idle -> generating
      state = transition(state, 'generating')
      expect(state.stage).toBe('generating')

      // generating -> pass1
      state = transition(state, 'pass1')
      expect(state.stage).toBe('pass1')

      // pass1 -> pass2
      state = transition(state, 'pass2')
      expect(state.stage).toBe('pass2')

      // pass2 -> executing
      state = transition(state, 'executing')
      expect(state.stage).toBe('executing')

      // executing -> aggregating
      state = transition(state, 'aggregating')
      expect(state.stage).toBe('aggregating')

      // aggregating -> complete
      state = transition(state, 'complete')
      expect(state.stage).toBe('complete')
    })

    it('handles error recovery flow', () => {
      let state = createInitialState()

      // Start pipeline
      state = transition(state, 'generating')
      state = transition(state, 'pass1')

      // Error occurs
      state = transition(state, 'error', 'Network failure')
      expect(state.stage).toBe('error')
      expect(state.error).toBe('Network failure')

      // Retry from error
      state = transition(state, 'generating')
      expect(state.stage).toBe('generating')
      expect(state.error).toBeUndefined()
    })

    it('handles multi-round execution', () => {
      let state: PipelineState = {
        ...createInitialState(),
        stage: 'aggregating',
        round: 1,
        queriesGenerated: ['q1'],
        pass1Completed: ['q1'],
        pass2Completed: ['q1'],
        executeCompleted: ['q1'],
      }

      // Start next round
      state = transition(state, 'generating')
      expect(state.round).toBe(2)
      expect(state.queriesGenerated).toEqual([])

      // Continue second round
      state = transition(state, 'pass1')
      state = transition(state, 'pass2')
      state = transition(state, 'executing')
      state = transition(state, 'aggregating')
      state = transition(state, 'complete')

      expect(state.stage).toBe('complete')
      expect(state.round).toBe(2)
    })
  })
})
