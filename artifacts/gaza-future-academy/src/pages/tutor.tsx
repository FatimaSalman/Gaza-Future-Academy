import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import {
  useListTutorConversations,
  useCreateTutorConversation,
  useListTutorMessages,
  getListTutorMessagesQueryKey,
  getListTutorConversationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircleCode, Send, Plus, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export function Tutor() {
  const { toast } = useToast();
  const { t, isRtl } = useLanguage();
  const queryClient = useQueryClient();

  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useListTutorConversations();
  const createConversation = useCreateTutorConversation();

  // Auto-select first conversation if none active
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const { data: messages, isLoading: loadingMessages } = useListTutorMessages(
    activeConversationId as number,
    {
      query: {
        enabled: !!activeConversationId,
        queryKey: getListTutorMessagesQueryKey(activeConversationId as number),
      },
    },
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage]);

  const handleNewConversation = () => {
    createConversation.mutate(
      { data: { title: t("محادثة جديدة", "New Conversation") } },
      {
        onSuccess: (newConv) => {
          setActiveConversationId(newConv.id);
          queryClient.invalidateQueries({
            queryKey: getListTutorConversationsQueryKey(),
          });
        },
      },
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConversationId || isSending) return;

    const userMsg = inputValue;
    setInputValue("");
    setIsSending(true);
    setStreamingMessage("");

    // Optimistically add user message to UI
    const tempUserMessage = {
      id: Date.now(),
      conversationId: activeConversationId,
      role: "user",
      content: userMsg,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData(
      getListTutorMessagesQueryKey(activeConversationId),
      (old: any) => {
        return [...(old || []), tempUserMessage];
      },
    );

    try {
      const response = await fetch(
        `/api/tutor/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: userMsg }),
        },
      );

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: t("تعذّر إرسال الرسالة", "Failed to send message"),
          description: t(
            "حدث خطأ، تأكد من إعداد خدمة الذكاء الاصطناعي.",
            "Something went wrong. Please make sure the AI service is configured.",
          ),
        });
        return;
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                setStreamingMessage((prev) => prev + data.content);
              }
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }

      // Refresh messages after stream finishes
      queryClient.invalidateQueries({
        queryKey: getListTutorMessagesQueryKey(activeConversationId),
      });
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
      setStreamingMessage("");
    }
  };

  return (
    <div className="flex h-[calc(100dvh-11rem)] md:h-[calc(100vh-9rem)] mt-2 gap-6 bg-card rounded-[3rem] border-4 border-border/50 overflow-hidden shadow-lg p-2">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-muted/30 rounded-[2.5rem] p-4 hidden md:flex flex-col gap-4 border-2 border-border/50">
        <Button
          onClick={handleNewConversation}
          className="w-full rounded-2xl h-14 font-black text-lg bg-[#2e7d32] hover:bg-[#2e7d32]/90 text-white shadow-sm"
        >
          <Plus className={cn("w-5 h-5", isRtl ? "ml-2" : "mr-2")} />
          {t("محادثة جديدة", "New Chat")}
        </Button>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2">
            {conversations?.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={cn(
                  "text-right p-4 rounded-2xl font-bold transition-all truncate text-[15px]",
                  activeConversationId === conv.id
                    ? "bg-white shadow-sm border-2 border-border text-[#2e7d32]"
                    : "hover:bg-white/50 text-muted-foreground border-2 border-transparent",
                )}
              >
                {conv.title || t("محادثة بدون عنوان", "Untitled Chat")}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] overflow-hidden border-2 border-border/50 relative">
        {/* Chat Header */}
        <div className="h-20 border-b-2 border-border/50 flex items-center px-8 bg-white z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#2e7d32]/10 flex items-center justify-center text-[#2e7d32]">
              <MessageCircleCode className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">
                {t("رفيق - معلم البرمجة", "Rafiq - Coding Tutor")}
              </h2>
              <p className="text-sm font-bold text-muted-foreground">
                {t(
                  "مستعد للإجابة عن أسئلتك!",
                  "Ready to answer your questions!",
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6 md:p-8">
          <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
            {/* Welcome message if empty */}
            {(!messages || messages.length === 0) && (
              <div className="flex flex-col items-center justify-center text-center py-20 gap-4 opacity-70">
                <div className="text-6xl">🤖</div>
                <h3 className="text-2xl font-black text-foreground">
                  {t("مرحباً! أنا رفيق.", "Hello! I am Rafiq.")}
                </h3>
                <p className="text-lg font-bold text-muted-foreground max-w-md">
                  {t(
                    "اسألني عن البرمجة، أو الألعاب، أو كيف تعمل الحواسيب!",
                    "Ask me about coding, games, or how computers work!",
                  )}
                </p>
              </div>
            )}

            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-4",
                  msg.role === "user"
                    ? isRtl
                      ? "flex-row"
                      : "flex-row-reverse"
                    : isRtl
                      ? "flex-row-reverse"
                      : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-2xl shadow-sm border-2 border-border/50",
                    msg.role === "user" ? "bg-accent/20" : "bg-[#2e7d32]/20",
                  )}
                >
                  {msg.role === "user" ? "👦" : "🤖"}
                </div>

                <div
                  className={cn(
                    "max-w-[80%] rounded-[2rem] p-5 font-medium text-[17px] leading-relaxed",
                    msg.role === "user"
                      ? "bg-accent text-white rounded-tr-sm"
                      : "bg-muted/50 text-foreground border-2 border-border/50 rounded-tl-sm",
                  )}
                >
                  {msg.content.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Streaming Message */}
            {streamingMessage && (
              <div
                className={cn(
                  "flex gap-4",
                  isRtl ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-2xl shadow-sm border-2 border-border/50 bg-[#2e7d32]/20">
                  🤖
                </div>

                <div className="max-w-[80%] rounded-[2rem] p-5 font-medium text-[17px] leading-relaxed bg-muted/50 text-foreground border-2 border-border/50 rounded-tl-sm">
                  {streamingMessage.split("\n").map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                  <span className="inline-block w-2 h-5 bg-[#2e7d32] animate-pulse ml-1 align-middle" />
                </div>
              </div>
            )}

            {loadingMessages && (
              <div className="flex items-center justify-center p-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-muted-foreground rounded-full animate-bounce delay-100" />
                  <div className="w-3 h-3 bg-muted-foreground rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white border-t-2 border-border/50 z-10">
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-3 max-w-4xl mx-auto bg-muted/30 p-2 rounded-[2rem] border-2 border-border/50 focus-within:border-[#2e7d32]/50 focus-within:bg-white transition-all"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t("اسأل رفيق عن أي شيء...", "Ask Rafiq anything...")}
              className="flex-1 h-14 bg-transparent border-none shadow-none text-lg font-bold focus-visible:ring-0 px-6"
              disabled={isSending || !activeConversationId}
            />
            <Button
              type="submit"
              disabled={
                !inputValue.trim() || isSending || !activeConversationId
              }
              size="icon"
              className="w-14 h-14 rounded-full shrink-0 bg-[#2e7d32] hover:bg-[#2e7d32]/90 text-white shadow-sm"
            >
              <Send className={cn("w-6 h-6", isRtl ? "rotate-180" : "")} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
