"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppLogo } from '@/components/icons';
import { auth } from '@/lib/firebase';
import { resetPasswordSchema } from '@/lib/schema';
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const oobCode = searchParams.get('oobCode');

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!oobCode) {
      setError("유효하지 않은 요청입니다. 비밀번호 재설정을 다시 시도해주세요.");
      setLoading(false);
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다. 다시 시도해주세요.");
        setLoading(false);
      });
  }, [oobCode]);

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    setError(null);
    if (!oobCode) {
        setError("유효하지 않은 요청입니다.");
        return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      toast({
        title: "비밀번호 재설정 완료",
        description: "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.",
      });
      setSuccess(true);
      setTimeout(() => router.push('/'), 3000);
    } catch (err: any) {
      console.error(err);
      setError("비밀번호 재설정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  }
  
  const renderContent = () => {
    if (loading) {
      return <p>확인 중...</p>;
    }

    if (error) {
       return (
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>오류</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
       )
    }

    if (success) {
        return (
            <div className='text-center'>
                <p className='text-green-600'>비밀번호가 성공적으로 재설정되었습니다.</p>
                <p className='text-sm text-muted-foreground mt-2'>잠시 후 로그인 페이지로 이동합니다.</p>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>새로운 비밀번호</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="새로운 비밀번호를 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>새로운 비밀번호 (확인)</FormLabel>
                    <FormControl>
                    <Input type="password" placeholder="비밀번호를 다시 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "변경 중..." : "비밀번호 변경"}
            </Button>
            </form>
        </Form>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4">
                <AppLogo className="h-16 w-16 text-primary" />
            </div>
          <CardTitle className="text-2xl font-bold font-headline">비밀번호 재설정</CardTitle>
          {!loading && !error && !success && (
             <CardDescription>새로운 비밀번호를 입력해주세요.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
            {renderContent()}
        </CardContent>
      </Card>
       <div className="mt-4 text-center">
            <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground"
                asChild
            >
                <Link href="/">로그인 페이지로 돌아가기</Link>
            </Button>
        </div>
    </div>
  );
}
