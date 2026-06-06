import { useState, useCallback } from 'react';
import './index.css';

import type {
  AppState,
  AppView,
  AgentMessage,
  RoundSummary,
  CompanyBrief,
} from './types';

import ModeSelector from './components/ModeSelector';
import IdeaInput from './components/IdeaInput';
import CompanyInput from './components/CompanyInput';
import Boardroom from './components/Boardroom';
import HRPanel from './components/HRPanel';
import Header from './components/Header';

const initialState: AppState = {
  view: 'home',
  mode: 'new_idea',
  isDebating: false,
  currentRound: 0,
  agentMessages: [],
  roundSummaries: [],
  researchQueries: [],
  memorySaves: [],
  memoryCount: 0,
  isReturning: false,
};

function App() {
  const [state, setState] = useState<AppState>(initialState);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const goHome = useCallback(() => {
    setState(initialState);
  }, []);

  const selectMode = useCallback((mode: 'new_idea' | 'existing' | 'hr_only') => {
    const viewMap: Record<string, AppView> = {
      new_idea: 'idea_input',
      existing: 'company_input',
      hr_only: 'hr_panel',
    };
    updateState({ mode, view: viewMap[mode] || 'idea_input' });
  }, [updateState]);

  const startBoardroom = useCallback((params: {
    companyId: string;
    companyName: string;
    sessionId: string;
    isReturning: boolean;
    memoryCount: number;
    companyBrief?: CompanyBrief;
  }) => {
    updateState({
      view: 'boardroom',
      companyId: params.companyId,
      companyName: params.companyName,
      sessionId: params.sessionId,
      isReturning: params.isReturning,
      memoryCount: params.memoryCount,
      companyBrief: params.companyBrief,
      isDebating: true,
      currentRound: 0,
      agentMessages: [],
      roundSummaries: [],
      memorySaves: [],
      businessPlan: undefined,
      investorScore: undefined,
      error: undefined,
    });
  }, [updateState]);

  // Handle SSE debate events
  const handleDebateEvent = useCallback((event: any) => {
    setState((prev) => {
      switch (event.type) {
        case 'memory_loaded':
          return {
            ...prev,
            memoryCount: event.count || 0,
          };

        case 'round_start':
          return {
            ...prev,
            currentRound: event.round,
          };

        case 'agent_start': {
          const newMsg: AgentMessage = {
            agent: event.agent,
            content: '',
            round: event.round,
            isComplete: false,
            emoji: event.emoji,
            color: event.color,
            title: event.title,
          };
          return {
            ...prev,
            agentMessages: [...prev.agentMessages, newMsg],
          };
        }

        case 'token': {
          const messages = [...prev.agentMessages];
          const lastIdx = messages.length - 1;
          if (lastIdx >= 0 && messages[lastIdx].agent === event.agent) {
            messages[lastIdx] = {
              ...messages[lastIdx],
              content: messages[lastIdx].content + event.content,
            };
          }
          return { ...prev, agentMessages: messages };
        }

        case 'agent_done': {
          const messages = [...prev.agentMessages];
          const lastIdx = messages.length - 1;
          if (lastIdx >= 0 && messages[lastIdx].agent === event.agent) {
            messages[lastIdx] = {
              ...messages[lastIdx],
              isComplete: true,
              confidence: event.confidence,
            };
          }
          return { ...prev, agentMessages: messages };
        }

        case 'round_summary': {
          const summary: RoundSummary = {
            round: event.round,
            conflicts: event.conflicts || [],
            agreements: event.agreements || [],
          };
          return {
            ...prev,
            roundSummaries: [...prev.roundSummaries, summary],
          };
        }

        case 'business_plan':
          return {
            ...prev,
            businessPlan: event.plan,
            investorScore: event.investor_readiness_score,
          };

        case 'memory_save':
          return {
            ...prev,
            memorySaves: [
              ...prev.memorySaves,
              { agent: event.agent, key: event.key },
            ],
          };

        case 'done':
          return {
            ...prev,
            isDebating: false,
            investorScore: event.score || prev.investorScore,
          };

        case 'error':
          return {
            ...prev,
            error: event.message,
            isDebating: false,
          };

        default:
          return prev;
      }
    });
  }, []);

  const renderView = () => {
    switch (state.view) {
      case 'home':
        return <ModeSelector onSelect={selectMode} />;

      case 'idea_input':
        return (
          <IdeaInput
            onBack={goHome}
            onStartDebate={startBoardroom}
            onDebateEvent={handleDebateEvent}
          />
        );

      case 'company_input':
        return (
          <CompanyInput
            onBack={goHome}
            onStartDebate={startBoardroom}
            onDebateEvent={handleDebateEvent}
          />
        );

      case 'boardroom':
        return (
          <Boardroom
            state={state}
            onBack={goHome}
            onDebateEvent={handleDebateEvent}
            onGoToHR={() => updateState({ view: 'hr_panel' })}
          />
        );

      case 'hr_panel':
        return (
          <HRPanel
            companyId={state.companyId}
            sessionId={state.sessionId}
            businessPlan={state.businessPlan}
            onBack={() =>
              state.sessionId
                ? updateState({ view: 'boardroom' })
                : goHome()
            }
          />
        );

      default:
        return <ModeSelector onSelect={selectMode} />;
    }
  };

  return (
    <>
      <Header
        onLogoClick={goHome}
        currentView={state.view}
        companyName={state.companyName}
        isDebating={state.isDebating}
      />
      <main className="app-content">{renderView()}</main>
    </>
  );
}

export default App;
