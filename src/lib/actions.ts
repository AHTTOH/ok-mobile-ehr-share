
"use server";

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { leaveRequestSchema, overtimeRequestSchema, businessTripRequestSchema, resignationSchema } from '@/lib/schema';
import { auth, db } from '@/lib/firebase';
import { addDoc, collection, Timestamp, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

// In a real app, this would be retrieved from a database based on the user's company
const HR_EMAIL = "hr@example.com";
const MOCKED_USER = { name: "홍길동", email: "0000000@okfngroup.com" };

// This function is no longer called from the leave page, but is kept for reference
// and to avoid breaking other parts of the app that might use it.
// The new logic is handled client-side in /leave/page.tsx.
export async function submitLeaveRequest(values: z.infer<typeof leaveRequestSchema>): Promise<{ success: boolean; error?: string }> {
    try {
        await addDoc(collection(db, "leave_quest"), {
            applicantId: MOCKED_USER.email,
            createDate: Timestamp.now(),
            leaveStartDate: Timestamp.fromDate(values.dateRange.from),
            leaveEndDate: values.dateRange.to ? Timestamp.fromDate(values.dateRange.to) : Timestamp.fromDate(values.dateRange.from),
            leaveSubType: values.leaveType,
            remark: values.reason || "",
            status: "처리대기",
        });
        return { success: true };
    } catch (error) {
        console.error("Error adding document: ", error);
        return { success: false, error: "데이터베이스에 요청을 저장하는 중 오류가 발생했습니다. Firestore 보안 규칙을 확인해주세요." };
    }
}

export async function submitOvertimeRequest(values: z.infer<typeof overtimeRequestSchema>) {
    console.log("--- 신규 연장근로 신청 ---");
    console.log("수신자:", HR_EMAIL);
    console.log("제목:", `[연장근로 신청] ${MOCKED_USER.name}`);
    console.log("신청자:", MOCKED_USER.name);
    console.log("이메일:", MOCKED_USER.email);
    console.log("근무일:", values.date);
    console.log("시간:", `${values.startTime} - ${values.endTime}`);
    console.log("사유:", values.reason || "없음");
    console.log("------------------------");
    
    // In a real app, you would send an email here.
    // For now, we just log and redirect.
    redirect('/success');
}

export async function submitBusinessTripRequest(values: z.infer<typeof businessTripRequestSchema>) {
    console.log("--- 신규 출장 신청 ---");
    console.log("수신자:", HR_EMAIL);
    console.log("제목:", `[출장 신청] ${MOCKED_USER.name}`);
    console.log("신청자:", MOCKED_USER.name);
    console.log("이메일:", MOCKED_USER.email);
    console.log("출장지:", values.destination);
    console.log("기간:", `${values.dateRange.from} - ${values.dateRange.to || values.dateRange.from}`);
    console.log("사유:", values.reason || "없음");
    console.log("------------------------");
    
    // In a real app, you would send an email here.
    // For now, we just log and redirect.
    redirect('/success');
}

export async function submitResignationRequest(values: z.infer<typeof resignationSchema>) {
    console.log("--- 신규 사직서 제출 (AI 면담 시작) ---");
    console.log("수신자:", HR_EMAIL);
    console.log("제목:", `[사직서 제출] ${MOCKED_USER.name}`);
    console.log("신청자:", MOCKED_USER.name);
    console.log("이메일:", MOCKED_USER.email);
    console.log("퇴사 예정일:", values.resignationDate);
    console.log("사유:", values.reason);
    console.log("------------------------");
    
    // In a real app, you would save this initial data to a database.
    // The redirect is now handled client-side to go to the interview page.
}

type Message = {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
};

export async function resignationChatAction({ history }: { history: Message[] }): Promise<{ success: boolean; message?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, message: 'OpenAI API 키가 설정되지 않았습니다. .env 파일에 키를 추가해주세요.' };
  }

  const systemPrompt = `You are a friendly and professional HR representative for OK Financial Group, conducting an AI-powered exit interview with a departing employee. Your name is 김민지.

The interview has a structured flow. Follow these steps precisely.

**Step 1: Initial Greeting and Opening Question**
- If the conversation history is empty, this is the beginning of the interview.
- Start by introducing yourself and expressing regret for their departure.
- Your first and only question in this initial message MUST be: "퇴사를 결정하시게 된 가장 큰 이유는 무엇입니까?" (What is the biggest reason for your decision to leave?)
- DO NOT ask any other questions in this first turn.

**Step 2: Acknowledging the Reason and Follow-up**
- The user will respond with one of the predefined reasons: "적성불일치, 업무강도/시간, 결혼/출산/육아, 직원 간 관계, 급여/복리후생, 건강문제/가족간병, 원거리발령/통근시간, 조직문화, 학업/유학/창업, 거주지 이전/이민, 인사적 불만(승진/평가/배치 등), 기타"
- If the user's response is "기타" (Other), you MUST ask them to elaborate on the specific reason. For example: "기타 사유를 선택해주셨네요. 구체적으로 어떤 이유인지 조금 더 자세히 말씀해주실 수 있을까요?"
- For any other reason, acknowledge their choice empathetically and ask one or two open-ended follow-up questions to understand their experience better. For example, if they chose "업무강도/시간" (Work Intensity/Hours), you could ask: "업무 강도나 시간에 대한 어려움이 있으셨군요. 어떤 점에서 특히 힘드셨는지, 그리고 회사가 어떻게 개선하면 좋을지 의견을 들려주실 수 있을까요?"
- Keep the conversation natural and empathetic.

**Step 3: Final Confirmation Questions**
- After you feel the conversation about their resignation reason and experiences has been sufficiently explored, transition to the final confirmation items.
- Introduce this section by saying something like: "소중한 의견 정말 감사합니다. 이제 마무리하기 전에 몇 가지만 간단히 확인하고 싶은 사항이 있습니다." (Thank you for your valuable feedback. Before we wrap up, I have just a few things I'd like to quickly confirm.)
- Then, ask the following two questions, one by one. Wait for the user's answer for the first question before asking the second one.
  1. "혹시 회사에서 제공하는 가족건강검진은 받으셨는지요?" (Did you happen to receive the company-provided family health check-up?)
  2. "네, 알겠습니다. 그리고 개인자산관리시스템에 등록된 개인 자산(PC, 모니터, 노트북 등)은 모두 반납 처리하셨는지 확인 부탁드립니다." (Okay, I see. Also, please confirm if you have returned all company assets (PC, monitor, laptop, etc.) registered in the personal asset management system.)

**Step 4: Closing the Interview**
- Once the confirmation questions are answered, you MUST end the conversation with the following exact phrase, without any additions or changes:
"그동안의 노고에 감사드리며, 앞날을 응원하며 면담을 종료합니다."`;

  // OpenAI API expects 'assistant' role instead of 'model'
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content
    })),
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API Error:", errorData);
      return { success: false, message: `API 호출에 실패했습니다: ${errorData.error?.message || response.statusText}` };
    }

    const data = await response.json();
    const botMessage = data.choices[0]?.message?.content;

    if (!botMessage) {
        return { success: false, message: 'AI로부터 유효한 답변을 받지 못했습니다.' };
    }

    return { success: true, message: botMessage.trim() };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `AI 서비스 호출 중 오류가 발생했습니다: ${errorMessage}` };
  }
}


export async function saveInterviewAndSummarize({ messages }: { messages: Message[] }): Promise<{ success: boolean; error?: string }> {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "로그인이 필요합니다." };
    }

    if (!messages || messages.length === 0) {
        return { success: false, error: "저장할 대화 내용이 없습니다."}
    }

    try {
        // Step 1: Save the full transcript
        const docRef = await addDoc(collection(db, "interview_logs"), {
            applicantId: user.uid,
            applicantEmail: user.email,
            fullTranscript: messages,
            createdAt: serverTimestamp(),
        });

        // Step 2: Call AI for summarization
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          console.error('OpenAI API 키가 설정되지 않았습니다.');
          // We saved the transcript, but summarization failed.
          return { success: true };
        }

        const transcriptText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n\n');

        const summaryPrompt = `다음은 퇴사자와의 면담 내용 전문입니다. 이 내용을 바탕으로 인사담당자가 빠르게 파악할 수 있도록 ①핵심 퇴사 사유, ②회사에 대한 긍정적 피드백, ③개선 및 건의사항 세 가지 항목으로 구분하여 요약해주세요.\n\n---면담 전문---\n${transcriptText}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: summaryPrompt }],
                temperature: 0.5,
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenAI API Error for summarization:", errorData);
            // Summarization failed but transcript is saved.
            return { success: true }; 
        }

        const data = await response.json();
        const summary = data.choices[0]?.message?.content;

        if (summary) {
            // Step 3: Update the document with the summary
            await updateDoc(doc(db, "interview_logs", docRef.id), {
                summary: summary.trim(),
            });
        }
        
        return { success: true };
    } catch (error) {
        console.error("Error saving and summarizing interview: ", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: `면담 기록 저장 및 요약 중 오류가 발생했습니다: ${errorMessage}` };
    }
}
