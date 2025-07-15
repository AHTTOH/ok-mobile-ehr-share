// src/app/resignation/interview/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { resignationChatAction, saveInterviewAndSummarize } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: 'user' | 'model';
  content: string;
};

const RESIGNATION_REASONS = [
  "적성불일치",
  "업무강도/시간",
  "결혼/출산/육아",
  "직원 간 관계",
  "급여/복리후생",
  "건강문제/가족간병",
  "원거리발령/통근시간",
  "조직문화",
  "학업/유학/창업",
  "거주지 이전/이민",
  "인사적 불만(승진/평가/배치 등)",
  "기타",
];


export default function ExitInterviewPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [showReasonButtons, setShowReasonButtons] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const startInterview = async () => {
      setIsLoading(true);
      try {
        const result = await resignationChatAction({ history: [] });
        if (result.success && result.message) {
          setMessages([{ role: 'model', content: result.message }]);
          if (!result.message.includes("응원하며 면담을 종료합니다")) {
            setShowReasonButtons(true);
          }
        } else {
          throw new Error(result.message || 'AI 응답을 받아오지 못했습니다.');
        }
      } catch (error) {
        console.error('Error starting interview:', error);
        setMessages([
          { role: 'model', content: '죄송합니다. AI 면담을 시작하는 중 오류가 발생했습니다.' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    startInterview();
  }, []);

  useEffect(scrollToBottom, [messages]);

  const sendChatMessage = async (newMessages: Message[]) => {
     setIsLoading(true);
    try {
      const result = await resignationChatAction({ history: newMessages });
      
      if (result.success && result.message) {
        setMessages((prev) => [...prev, { role: 'model', content: result.message }]);
        if (result.message.includes("응원하며 면담을 종료합니다")) {
          setIsInterviewFinished(true);
        }
      } else {
        throw new Error(result.message || 'AI 응답을 받아오지 못했습니다.');
      }
    } catch (error) {
      console.error('Error conducting interview:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: '죄송합니다, 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    await sendChatMessage(newMessages);
  };
  
  const handleReasonSelect = async (reason: string) => {
    setShowReasonButtons(false);
    const newMessages: Message[] = [...messages, { role: 'user', content: reason }];
    setMessages(newMessages);
    await sendChatMessage(newMessages);
  };

  const handleFinishInterview = async () => {
    setIsSaving(true);
    try {
      const result = await saveInterviewAndSummarize({ messages });
      if (result.success) {
        toast({
          title: "저장 완료",
          description: "면담 내용이 안전하게 저장 및 요약되었습니다.",
        });
        router.push('/dashboard');
      } else {
        throw new Error(result.error || '면담 내용 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error finishing interview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: `저장 중 오류가 발생했습니다: ${errorMessage}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="flex flex-1 flex-col">
      <CardContent className="flex flex-1 flex-col space-y-4 p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.role === 'model' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {message.content}
                </div>
                  {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && messages.length > 0 && (
                <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg px-4 py-2 text-sm bg-muted">
                        ...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="border-t pt-4">
          {isInterviewFinished ? (
              <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">면담이 종료되었습니다. 소중한 의견 감사합니다.</p>
                  <Button onClick={handleFinishInterview} className="w-full" disabled={isSaving}>
                      {isSaving ? '저장 중...' : '완료하고 대시보드로 돌아가기'}
                  </Button>
              </div>
          ) : showReasonButtons ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {RESIGNATION_REASONS.map((reason) => (
                  <Button
                    key={reason}
                    variant="outline"
                    className="h-auto justify-center text-center text-xs py-2"
                    onClick={() => handleReasonSelect(reason)}
                    disabled={isLoading}
                  >
                    {reason}
                  </Button>
                ))}
              </div>
          ) : (
              <div className="flex items-center gap-2">
                  <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="메시지를 입력하세요..."
                      disabled={isLoading}
                      autoFocus
                  />
                  <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                      {isLoading ? '전송 중...' : '전송'}
                  </Button>
              </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
