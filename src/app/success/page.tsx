import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
        <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">신청 완료!</h2>
                <p className="text-muted-foreground mb-6">
                    신청이 성공적으로 제출되었습니다.
                    <br/>
                    담당자가 확인 후 처리할 예정입니다.
                </p>
                <Button asChild className="w-full">
                    <Link href="/dashboard">
                        대시보드로 돌아가기
                    </Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
