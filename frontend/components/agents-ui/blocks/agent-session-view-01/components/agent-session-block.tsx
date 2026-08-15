"use client";

import React, { useEffect, useRef, useState } from "react";
import { Track } from "livekit-client";
import { AnimatePresence, type MotionProps, motion } from "motion/react";
import {
  useAgent,
  useSessionContext,
  useSessionMessages,
} from "@livekit/components-react";

import {
  AgentControlBar,
  type AgentControlBarControls,
} from "@/components/agents-ui/agent-control-bar";
import { Button } from "@/components/ui/button";
import { TileLayout } from "./tile-view";
import { cn } from "@/lib/shadcn/utils";



// Motion constants
const BOTTOM_VIEW_MOTION_PROPS: MotionProps = {
  variants: {
    visible: { opacity: 1, translateY: "0%" },
    hidden: { opacity: 0, translateY: "100%" },
  },
  initial: "hidden",
  animate: "visible",
  exit: "hidden",
  transition: { duration: 0.3, delay: 0.5, ease: "easeOut" },
};

const CHAT_MOTION_PROPS: MotionProps = {
  variants: {
    hidden: {
      opacity: 0,
      transition: { ease: "easeOut", duration: 0.3 },
    },
    visible: {
      opacity: 1,
      transition: { delay: 0.2, ease: "easeOut", duration: 0.3 },
    },
  },
  initial: "hidden",
  animate: "visible",
  exit: "hidden",
};

const SHIMMER_MOTION_PROPS: MotionProps = {
  variants: {
    visible: {
      opacity: 1,
      transition: { ease: "easeIn", duration: 0.5, delay: 0.8 },
    },
    hidden: {
      opacity: 0,
      transition: { ease: "easeIn", duration: 0.5, delay: 0 },
    },
  },
  initial: "hidden",
  animate: "visible",
  exit: "hidden",
};

// Helper component
interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({
  top = false,
  bottom = false,
  className,
}: FadeProps) {
  return (
    <div
      className={cn(
        "from-background pointer-events-none h-4 bg-linear-to-b to-transparent",
        top && "bg-linear-to-b",
        bottom && "bg-linear-to-t",
        className,
      )}
    />
  );
}

export interface AgentSessionView_01Props {
  preConnectMessage?: string;
  supportsChatInput?: boolean;
  supportsVideoInput?: boolean;
  supportsScreenShare?: boolean;
  isPreConnectBufferEnabled?: boolean;
  audioVisualizerType?: "bar" | "wave" | "grid" | "radial" | "aura";
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerBarCount?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerWaveLineWidth?: number;
  className?: string;
  onClose?: () => void;
}

export function AgentSessionView_01({
  preConnectMessage = "Agent is listening, ask it a question",
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
  className,
  onClose,
}: React.ComponentProps<"section"> & AgentSessionView_01Props) {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);

  const lastMessage = messages.at(-1);
  const isAssistantMessage = lastMessage?.from?.isLocal === false;

  const [chatOpen, setChatOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const hadConnectedRef = useRef(false);
  const [showEndOverlay, setShowEndOverlay] = useState(false);

  const { state: agentState } = useAgent();

  const [micError, setMicError] = useState<string | undefined>(
    undefined,
  );

  const localParticipant = (session?.local as any)?.participant;
  const localIsSpeaking = Boolean(
    (localParticipant as any)?.isSpeaking === true,
  );

  const remoteParticipant = (session?.room as any)?.remoteParticipants
    ? Array.from(
      (session.room as any).remoteParticipants.values(),
    )[0]
    : undefined;

  const remoteIsSpeaking = Boolean(
    (remoteParticipant as any)?.isSpeaking === true,
  );

  // Determine status text based on session and speaking states
  const statusText = (() => {
    if (!session.isConnected) return preConnectMessage;
    if (localIsSpeaking) return "AI is listening...";
    if (remoteIsSpeaking) return "AI Assistant is speaking...";
    return "Agent is listening, ask it a question";
  })();

  /*
   * Try Again:
   * Reloading the page returns the application to its original
   * startup flow and avoids creating a second LiveKit session.
   */
  const handleTryAgain = () => {
    window.location.reload();
  };

  const handleClose = () => {
    setShowEndOverlay(false);
    if (onClose) {
      onClose();
    }
  };

  /*
   * Detect a real session ending.
   *
   * hadConnectedRef prevents the Session Ended screen from appearing
   * before the first connection has ever been established.
   */
  useEffect(() => {
    if (session.isConnected) {
      hadConnectedRef.current = true;
    }

    if (!session.isConnected && hadConnectedRef.current) {
      setShowEndOverlay(true);
    }
  }, [session.isConnected]);

  useEffect(() => {
    console.log("Agent UI state:", {
      sessionConnected: session?.isConnected,
      agentState,
      remoteIsSpeaking,
      isAssistantMessage,
    });
  }, [
    session?.isConnected,
    agentState,
    remoteIsSpeaking,
    isAssistantMessage,
  ]);

  const controls: AgentControlBarControls = {
    leave: true,
    microphone: true,
    chat: false,
    camera: supportsVideoInput,
    screenShare: supportsScreenShare,
  };

  useEffect(() => {
    const last = messages.at(-1);
    const lastIsLocal = last?.from?.isLocal === true;

    if (scrollAreaRef.current && lastIsLocal) {
      scrollAreaRef.current.scrollTop =
        scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleDeviceError = ({
    source,
    error,
  }: {
    source: Track.Source;
    error: Error;
  }) => {
    if (source === Track.Source.Microphone) {
      setMicError(
        error?.message ?? "Microphone access denied",
      );
    }
  };

  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      // @ts-ignore - older lib definitions may not include "microphone"
      navigator.permissions
        .query({ name: "microphone" })
        .then((status) => {
          if (status.state === "denied") {
            setMicError(
              "Microphone access is blocked. Please enable microphone in your browser settings and refresh.",
            );
          }
        });
    }
  }, []);

  const tryRequestMic = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      setMicError(undefined);
    } catch (err: any) {
      setMicError(
        "Microphone access is blocked. Please allow microphone access in your browser settings and try again.",
      );
    }
  };

  const isSessionEnded = (!session.isConnected && hadConnectedRef.current) || showEndOverlay;

  return (
    <motion.section
      {...SHIMMER_MOTION_PROPS}
      className={cn(
        "pointer-events-auto mx-auto block w-full max-w-2xl pb-4 text-center text-sm font-semibold",
        className,
      )}
    >
      {/* Status Text */}
      <motion.div {...SHIMMER_MOTION_PROPS} className="text-lg font-medium mb-2">
        {statusText}
      </motion.div>

      {/* Visualizer and transcript container */}
      <div className="flex flex-col items-center w-full">
        <TileLayout
          chatOpen={chatOpen}
          audioVisualizerType={audioVisualizerType}
          audioVisualizerColor={audioVisualizerColor}
          audioVisualizerColorShift={audioVisualizerColorShift}
          audioVisualizerBarCount={audioVisualizerBarCount}
          audioVisualizerGridRowCount={audioVisualizerGridRowCount}
          audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
          audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
          audioVisualizerRadialRadius={audioVisualizerRadialRadius}
          audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
        />
      </div>

      {/* Chat transcript */}


      {/* Control Bar fixed at bottom */}
      {!isSessionEnded && (
        <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-2xl z-50 pointer-events-auto">
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
      )}

      {/* Persistent Session Ended screen */}
      {isSessionEnded && (
        <div className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-background mx-4 w-full max-w-lg rounded-2xl p-8 text-center shadow-xl border border-border">
            <h3 className="text-2xl font-bold">
              Session Ended
            </h3>

            <p className="text-muted-foreground mt-3">
              Your session has ended.
            </p>

            <p className="text-muted-foreground mt-1">
              Would you like to try again?
            </p>

            <div className="mt-6 flex justify-center gap-3">
              <Button
                className="rounded-full bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                onClick={handleTryAgain}
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                className="rounded-full border px-6 py-2"
                onClick={handleClose}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Microphone error */}
      {micError && (
        <div className="pointer-events-auto fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-background mx-4 max-w-lg rounded-lg p-6 text-center">
            <h3 className="text-lg font-bold">
              Microphone access blocked
            </h3>

            <p className="text-muted-foreground mt-2 text-sm">
              {micError}. To use LearnMate AI, enable your microphone
              in your browser settings and refresh the page.
            </p>

            <div className="mt-4 flex justify-center gap-3">
              <Button
                className="rounded-full bg-blue-600 px-4 py-2 text-white"
                onClick={tryRequestMic}
              >
                Try Again
              </Button>

              <Button
                variant="outline"
                className="rounded-full border px-4 py-2"
                onClick={() => setMicError(undefined)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}