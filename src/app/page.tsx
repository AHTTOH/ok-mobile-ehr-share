"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppLogo } from '@/components/icons';
import { auth } from '@/lib/firebase';
import { loginSchema } from '@/lib/schema';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email') {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  }

  async function handlePasswordReset() {
    setError(null);
    const email = form.getValues("email");
    
    const emailValidation = z.string().email({ message: "유효한 이메일을 입력해주세요." }).safeParse(email);
    if (!emailValidation.success) {
      setError("비밀번호를 재설정할 유효한 이메일 주소를 입력해주세요.");
      form.setFocus("email");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "재설정 이메일 발송",
        description: "비밀번호 재설정 링크가 이메일로 전송되었습니다. 받은 편지함을 확인해주세요.",
      });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError("가입되지 않은 이메일 주소입니다.");
      } else {
        setError("비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.");
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <AppLogo className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold font-headline">모바일 eHR 신청 시스템</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="이메일을 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>비밀번호</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="비밀번호를 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>오류</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2 pt-2">
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                       {form.formState.isSubmitting ? "로그인 중..." : "로그인"}
                    </Button>
                    <div className="text-center">
                        <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-muted-foreground font-normal"
                            onClick={handlePasswordReset}
                        >
                            비밀번호 재설정
                        </Button>
                    </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          OK금융그룹
        </p>
      </div>
    </main>
  );
}
