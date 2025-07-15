import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Briefcase, Clock, FileText, Plane, FileMinus, Receipt, Gift } from 'lucide-react';

export default function Dashboard() {
  const menuItems = [
    { href: '/leave', icon: Plane, title: '휴가 신청' },
    { href: '/overtime', icon: Clock, title: '연장근로 신청' },
    { href: '/business-trip', icon: Briefcase, title: '출장 신청' },
    { href: '/condolences-payment', icon: Award, title: '경조금 신청' },
    { href: '/certificate-request', icon: FileText, title: '제증명서 신청' },
    { href: '/welfare/condo-reservation', icon: Gift, title: '복리후생 신청' },
    { href: '/resignation', icon: FileMinus, title: '사직서 제출' },
    { href: '/payslip', icon: Receipt, title: '급여명세서' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold font-headline tracking-tight">
        무엇을 도와드릴까요?
      </h1>
      <p className="text-muted-foreground mt-2">
        원하시는 메뉴를 선택하여 신청을 진행해주세요.
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} className="group flex">
            <Card className="w-full transition-all hover:bg-muted/50">
              <CardHeader className="flex h-full flex-col items-center justify-center p-4 text-center">
                <div className="mb-3 rounded-lg bg-primary/10 p-3">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-headline text-sm font-medium leading-tight">
                  {item.title}
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
