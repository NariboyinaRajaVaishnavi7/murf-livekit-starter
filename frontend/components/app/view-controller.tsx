'use client';

import { useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',

};

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const session = useSessionContext();
  const { isConnected, start } = session;
  const localParticipant = (session?.local as any)?.participant;
  const connectionState = (session as any)?.connectionState;
  const isConnecting =
    connectionState === 'connecting' || connectionState === 'pre-connect-buffering';
  const { resolvedTheme } = useTheme();

  const [hasEndedSession, setHasEndedSession] = useState(false);
  const wasConnectedRef = useRef(false);

  if (isConnected && !wasConnectedRef.current) {
    wasConnectedRef.current = true;
  }

  const showSessionView = isConnected || hasEndedSession || (wasConnectedRef.current && !isConnected);

  const handleCloseSessionEnded = () => {
    wasConnectedRef.current = false;
    setHasEndedSession(false);
  };

  const handleStartCall = () => {
    wasConnectedRef.current = false;
    setHasEndedSession(false);
    start();
  };

  return (
    <AnimatePresence mode="wait">
      {/* Welcome view */}
      {!showSessionView && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={appConfig.startButtonText}
          onStartCall={handleStartCall}
          isConnecting={isConnecting}
        />
      )}
      {/* Session view */}
      {showSessionView && (
        <MotionSessionView
          key="session-view"
          {...VIEW_MOTION_PROPS}
          onClose={handleCloseSessionEnded}
          supportsChatInput={appConfig.supportsChatInput}
          supportsVideoInput={appConfig.supportsVideoInput}
          supportsScreenShare={appConfig.supportsScreenShare}
          isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
          audioVisualizerType={appConfig.audioVisualizerType}
          audioVisualizerColor={
            resolvedTheme === 'dark'
              ? appConfig.audioVisualizerColorDark
              : appConfig.audioVisualizerColor
          }
          audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
          audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
          audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
          audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
          audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
          audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
          audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
          className="fixed inset-0"
        />
      )}
    </AnimatePresence>
  );
}
