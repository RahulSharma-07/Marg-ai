"use client";

import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";



export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** ISO timestamp for rendering order */
  timestamp: string;
}

interface SendMessagePayload {
  question: string;
  topicId?: string;
}

interface DoubtApiResponse {
  answer: string;
}



async function callDoubtApi(
  question: string,
  topicId: string | undefined,
  history: ChatMessage[]
): Promise<string> {
  const res = await fetch("/api/chat/doubt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      topic_id: topicId,
      // Only pass the last 10 exchanges to stay within context budget
      history: history.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Server error (${res.status})`);
  }

  const data = (await res.json()) as DoubtApiResponse;
  return data.answer;
}



interface UseChatOptions {

    
  topicId?: string;


  initialMessages?: ChatMessage[];
}

/**
 * Manages chat state and API calls for the AI doubt solver.
 *
 * @example
 * const { messages, sendMessage, isLoading, error, clearMessages } = useChat({ topicId });
 */
export function useChat(options: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    options.initialMessages ?? []
  );

  const mutation = useMutation<string, Error, SendMessagePayload>({
    mutationFn: ({ question, topicId }) =>
      callDoubtApi(question, topicId ?? options.topicId, messages),
    onMutate: ({ question }) => {
      // Optimistically add user message
      const userMsg: ChatMessage = {
        role: "user",
        content: question,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
    },
    onSuccess: (answer) => {
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: answer,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    },
    onError: (error) => {
      // Add an error message to the chat so the user knows what happened
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Sorry, something went wrong: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  /**
   * Send a message to the AI doubt solver.
   */
  const sendMessage = useCallback(
    (question: string, topicId?: string) => {
      if (!question.trim()) return;
      mutation.mutate({ question: question.trim(), topicId });
    },
    [mutation]
  );

  
  
  const clearMessages = useCallback(() => {
    setMessages([]);
    mutation.reset();
  }, [mutation]);

  return {
    messages,
    sendMessage,
    isLoading: mutation.isPending,
    error: mutation.error,
    clearMessages,
  };
}
