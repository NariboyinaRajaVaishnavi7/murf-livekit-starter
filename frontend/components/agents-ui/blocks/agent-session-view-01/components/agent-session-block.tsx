'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, type MotionProps, motion } from 'motion/react';
import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import {
  AgentControlBar,
  type AgentControlBarControls,
} from '@/components/agents-ui/agent-control-bar';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';
import { TileLayout } from './tile-view';

const MotionMessage = motion.create(Shimmer);

const BOTTOM_VIEW_MOTION_PROPS: MotionProps = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  },
};

const CHAT_MOTION_PROPS: MotionProps = {
  variants: {
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeOut',
        duration: 0.3,
      },
    },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.2,
        ease: 'easeOut',
        duration: 0.3,
      },
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

const SHIMMER_MOTION_PROPS: MotionProps = {
  variants: {
    visible: {
      opacity: 1,
      transition: {
        ease: 'easeIn',
        duration: 0.5,
        delay: 0.8,
      },
    },
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeIn',
        duration: 0.5,
        delay: 0,
      },
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}

export interface AgentSessionView_01Props {
  /**
   * Message shown above the controls before the first chat message is sent.
   *
   * @default 'Agent is listening, ask it a question'
   */
  preConnectMessage?: string;
  /**
   * Enables or disables the chat toggle and transcript input controls.
   *
   * @default true
   */
  supportsChatInput?: boolean;
  /**
   * Enables or disables camera controls in the bottom control bar.
   *
   * @default true
   */
  supportsVideoInput?: boolean;
  /**
   * Enables or disables screen sharing controls in the bottom control bar.
   *
   * @default true
   */
  supportsScreenShare?: boolean;
  /**
   * Shows a pre-connect buffer state with a shimmer message before messages appear.
   *
   * @default true
   */
  isPreConnectBufferEnabled?: boolean;

  /** Selects the visualizer style rendered in the main tile area. */
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  /** Primary hex color used by supported audio visualizer variants. */
  audioVisualizerColor?: `#${string}`;
  /** Hue shift intensity used by certain visualizers. */
  audioVisualizerColorShift?: number;
  /** Number of bars to render when `audioVisualizerType` is `bar`. */
  audioVisualizerBarCount?: number;
  /** Number of rows in the visualizer when `audioVisualizerType` is `grid`. */
  audioVisualizerGridRowCount?: number;
  /** Number of columns in the visualizer when `audioVisualizerType` is `grid`. */
  audioVisualizerGridColumnCount?: number;
  /** Number of radial bars when `audioVisualizerType` is `radial`. */
  audioVisualizerRadialBarCount?: number;
  /** Base radius of the radial visualizer when `audioVisualizerType` is `radial`. */
  audioVisualizerRadialRadius?: number;
  /** Stroke width of the wave path when `audioVisualizerType` is `wave`. */
  audioVisualizerWaveLineWidth?: number;
  /** Optional class name merged onto the outer `<section>` container. */
  className?: string;
}

export function AgentSessionView_01({
  preConnectMessage = 'Agent is listening, ask it a question',
  supportsChatInput = true,
  supportsVideoInput = true,
  supportsScreenShare = true,
  isPreConnectBufferEnabled = true,

  audioVisualizerType,
  audioVisualizerColor,
  audioVisualizerColorShift,
  audioVisualizerBarCount,
  audioVisualizerGridRowCount,
  audioVisualizerGridColumnCount,
  audioVisualizerRadialBarCount,
  audioVisualizerRadialRadius,
  audioVisualizerWaveLineWidth,
  ref,
  className,
  ...props
}: React.ComponentProps<'section'> & AgentSessionView_01Props) {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  // Detect if the latest message came from the AI assistant (non‑local)
  const lastMessage = messages.at(-1);
  const isAssistantMessage = lastMessage?.from?.isLocal === false;

  const [chatOpen, setChatOpen] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);



  const { state: agentState } = useAgent(); // single declaration
  const [micError, setMicError] = useState<string | undefined>(undefined);
  const hadConnectedRef = useRef(false);

  // speaking indicators (read flags directly to avoid calling hooks without a participant)
  const localParticipant = (session?.local as any)?.participant;
  const localIsSpeaking = Boolean((localParticipant as any)?.isSpeaking === true);
  // pick first remote participant (assistant)
  const remoteParticipant = (session?.room as any)?.remoteParticipants
    ? Array.from((session.room as any).remoteParticipants.values())[0]
    : undefined;
  const remoteIsSpeaking = Boolean((remoteParticipant as any)?.isSpeaking === true);

  // Show AI speaking UI for a short period after remote starts speaking


  React.useEffect(() => {
      console.log('Agent UI state:', {
        sessionConnected: session?.isConnected,
        agentState,
        remoteIsSpeaking,
        isAssistantMessage,
      });
  },
  [session?.isConnected, agentState, remoteIsSpeaking, isAssistantMessage]);

  const controls: AgentControlBarControls = {
    leave: true,
    microphone: true,
    chat: supportsChatInput,
    camera: supportsVideoInput,
    screenShare: supportsScreenShare,
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (session.isConnected) hadConnectedRef.current = true;
  }, [session.isConnected]);

  const handleDeviceError = ({ source, error }: { source: Track.Source; error: Error }) => {
    if (source === Track.Source.Microphone) {
      setMicError(error?.message ?? 'Microphone access denied');
    }
  };

  const tryRequestMic = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicError(undefined);
    } catch (err: any) {
      setMicError(
        'Microphone access is blocked. Please allow microphone access in your browser settings and try again.'
      );
    }
  };

  return (
    <section
      ref={ref}
      className={cn('bg-background relative z-10 h-full w-full overflow-hidden', className)}
      {...props}
    >
      {/* Header: title & subtitle (kept, but banner removed) */}
      <div className="absolute inset-x-4 top-6 z-40 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="text-xl font-bold">LearnMate AI</div>
          <div className="text-muted-foreground text-sm">Your friendly AI voice tutor</div>
        </div>
      </div>




        {/* Microphone permission error UI */}
        {micError && (
          <div className="flex flex-col items-center justify-center text-center px-4 py-12">
            <div className="text-6xl font-bold text-red-600">🔇</div>
            <h1 className="mt-4 text-3xl font-bold">MICROPHONE ACCESS REQUIRED</h1>
            <p className="mt-2 text-muted-foreground">LearnMate AI needs microphone access to hear you.</p>
            <p className="mt-2 text-muted-foreground">Please allow microphone access in your browser settings.</p>
            <Button className="mt-6" onClick={tryRequestMic}>TRY AGAIN</Button>
          </div>
        )}

{/* Central status screen – now the only place we show CONNECTING, LISTENING, SPEAKING, CALL ENDED, etc. */}
      <div className="flex flex-1 flex-col items-center justify-center text-center px-4 py-12">
        {(() => {
          if (!session.isConnected) {
            const cs = (session as any).connectionState;
            if (cs === 'connecting' || cs === 'pre-connect-buffering') {
              return (
                <>
                  <h1 className="text-5xl font-bold">CONNECTING...</h1>
                  <p className="mt-2 text-muted-foreground">Connecting to your AI tutor. Please wait...</p>
                  <div className="mt-6">
                    <div className="h-2 w-24 bg-primary animate-pulse rounded-full"></div>
                  </div>
                </>
              );
            }
            if (hadConnectedRef.current) {
              return (
                <>
                  <h1 className="text-5xl font-bold">CALL ENDED</h1>
                  <p className="mt-2 text-muted-foreground">Your learning session has ended.</p>
                  <Button className="mt-4 w-48" onClick={() => (session.start as any)?.()}>
                    START AGAIN
                  </Button>
                </>
              );
            }
          }
            if (agentState === 'speaking' || remoteIsSpeaking) {
              return (
                <div className="relative z-60 flex flex-col items-center justify-center">
                  <div className="text-7xl animate-pulse">🔊</div>
                  <h1 className="mt-2 text-5xl font-bold">AI IS SPEAKING</h1>
                  <p className="mt-2 text-muted-foreground">Your AI tutor is responding...</p>
                </div>
              );
            }
          // Listening state
          return (
            <>
              <div className="text-7xl">🎤</div>
              <h1 className="mt-2 text-5xl font-bold">LISTENING</h1>
              <p className="mt-2 text-muted-foreground">I'm listening to you...</p>
            </>
          );
        })()}
      </div>
      <Fade top className="absolute inset-x-4 top-0 z-10 h-40" />
      {/* transcript */}

      <div className="absolute top-0 bottom-[135px] flex w-full flex-col md:bottom-[170px]">
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              {...CHAT_MOTION_PROPS}
              className="flex h-full w-full flex-col gap-4 space-y-3 transition-opacity duration-300 ease-out"
            >
              <AgentChatTranscript
                agentState={agentState}
                messages={messages}
                className="mx-auto w-full max-w-2xl [&_.is-user>div]:rounded-[22px] [&>div>div]:px-4 [&>div>div]:pt-40 md:[&>div>div]:px-6"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Tile layout */}
      <TileLayout
        chatOpen={chatOpen}
        audioVisualizerType={audioVisualizerType}
        audioVisualizerColor={audioVisualizerColor}
        audioVisualizerColorShift={audioVisualizerColorShift}
        audioVisualizerBarCount={audioVisualizerBarCount}
        audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
        audioVisualizerRadialRadius={audioVisualizerRadialRadius}
        audioVisualizerGridRowCount={audioVisualizerGridRowCount}
        audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
        audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
      />
      {/* Bottom */}
      <motion.div
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="absolute inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        {/* Pre-connect message */}
        {isPreConnectBufferEnabled && (
          <AnimatePresence>
            {messages.length === 0 && (
              <MotionMessage
                key="pre-connect-message"
                duration={2}
                aria-hidden={messages.length > 0}
                {...SHIMMER_MOTION_PROPS}
                className="pointer-events-none mx-auto block w-full max-w-2xl pb-4 text-center text-sm font-semibold"
              >
                {preConnectMessage}
              </MotionMessage>
            )}
          </AnimatePresence>
        )}
        <div className="bg-background relative mx-auto max-w-2xl pb-3 md:pb-12">
          <Fade bottom className="absolute inset-x-0 top-0 h-4 -translate-y-full" />
          <AgentControlBar
            variant="livekit"
            controls={controls}
            isChatOpen={chatOpen}
            isConnected={session.isConnected}
            onDisconnect={session.end}
            onIsChatOpenChange={setChatOpen}
            onDeviceError={handleDeviceError}
          />
        </div>
      </motion.div>

      {/* Microphone permission error overlay */}
      {micError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background mx-4 max-w-lg rounded-lg p-6 text-center">
            <h3 className="text-lg font-bold">Microphone access blocked</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {micError}. To use LearnMate AI, enable your microphone in your browser settings and
              refresh the page.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-white"
                onClick={() => {
                  tryRequestMic();
                }}
              >
                Try Again
              </button>
              <button
                className="rounded-full border px-4 py-2"
                onClick={() => {
                  setMicError(undefined);
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call ended overlay with Start Again */}
      {hadConnectedRef.current && !session.isConnected && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
          <div className="bg-background/95 pointer-events-auto rounded-lg p-6 text-center shadow-lg">
            <h3 className="text-xl font-bold">Call Ended</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Thanks for learning — start again anytime.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                className="rounded-full bg-blue-600 px-4 py-2 text-white"
                onClick={() => {
                  (session.start as any)?.();
                }}
              >
                Start Again
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
