import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt } from 'lucide-react';

export default function PayslipPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
        <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                <Receipt className="h-16 w-16 text-primary mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">급여명세서</h2>
                <p className="text-muted-foreground mb-6">
                    해당 기능은 현재 준비 중입니다.
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
