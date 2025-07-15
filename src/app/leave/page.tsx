
"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format, addDays, differenceInCalendarDays, isWeekend } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { leaveRequestSchema } from "@/lib/schema"
import { auth, db, storage } from "@/lib/firebase"
import { Label } from "@/components/ui/label"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function LeaveRequestPage() {
  const { toast } = useToast()
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [businessDays, setBusinessDays] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [showFamilyCareAlert, setShowFamilyCareAlert] = useState(false);
  const [isFamilyCareLeave, setIsFamilyCareLeave] = useState(false);
  
  const form = useForm<z.infer<typeof leaveRequestSchema>>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      approverPosition: "",
      approverName: "",
      reason: "",
      emergencyContact: "",
      location: "",
      startTime: "",
      endTime: "",
    },
  })

  const leaveType = form.watch("leaveType");
  const dateRange = form.watch("dateRange");
  
  const timeBasedLeaveTypes = [
    '반차(오전)', '반차(오후)', '반반차(오전)', '반반차(오후)', 
    '공가(오전)', '공가(오후)', '지각', '조퇴'
  ];
  const showTimeInputs = timeBasedLeaveTypes.includes(leaveType);
  const fileRef = form.register("attachment");
  const fileRef2 = form.register("attachment2");

  useEffect(() => {
    const isFamilyCare = leaveType === "가족돌봄휴가";
    setIsFamilyCareLeave(isFamilyCare);
  }, [leaveType]);

  useEffect(() => {
    if (dateRange?.from) {
      const from = dateRange.from;
      const to = dateRange.to || dateRange.from;
  
      const total = differenceInCalendarDays(to, from) + 1;
      setTotalDays(total > 0 ? total : 0);
  
      let business = 0;
      if (total > 0) {
        let currentDate = from;
        while (currentDate <= to) {
          if (!isWeekend(currentDate)) {
            business++;
          }
          currentDate = addDays(currentDate, 1);
        }
      }
      setBusinessDays(business);
    } else {
      setTotalDays(0);
      setBusinessDays(0);
    }
  }, [dateRange]);

  async function onSubmit(data: z.infer<typeof leaveRequestSchema>) {
    const user = auth.currentUser;

    if (!user) {
      toast({
        variant: "destructive",
        title: "로그인 필요",
        description: "신청서를 제출하려면 로그인이 필요합니다.",
      });
      router.push('/');
      return;
    }

    let attachmentUrl = "";
    let attachmentUrl2 = "";
    try {
      setIsUploading(true);
      const file = data.attachment?.[0];
      if (file) {
        const storageRef = ref(storage, `leave-attachments/${user.uid}/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        attachmentUrl = await getDownloadURL(storageRef);
      }
      
      const file2 = data.attachment2?.[0];
      if (file2) {
        const storageRef2 = ref(storage, `leave-attachments/${user.uid}/${Date.now()}-${file2.name}`);
        await uploadBytes(storageRef2, file2);
        attachmentUrl2 = await getDownloadURL(storageRef2);
      }

      await addDoc(collection(db, "leave_quest"), {
        approverPosition: data.approverPosition,
        approverName: data.approverName,
        leaveSubType: data.leaveType,
        leaveStartDate: Timestamp.fromDate(data.dateRange.from),
        leaveEndDate: data.dateRange.to ? Timestamp.fromDate(data.dateRange.to) : Timestamp.fromDate(data.dateRange.from),
        totalDays: totalDays,
        businessDays: businessDays,
        remark: data.reason || "",
        status: "처리대기",
        applicantId: user.uid,
        applicantEmail: user.email,
        createDate: serverTimestamp(),
        ...(showTimeInputs && data.startTime && { startTime: data.startTime }),
        ...(showTimeInputs && data.endTime && { endTime: data.endTime }),
        ...(data.emergencyContact && { emergencyContact: data.emergencyContact }),
        ...(data.location && { location: data.location }),
        ...(attachmentUrl && { attachmentUrl: attachmentUrl }),
        ...(attachmentUrl2 && { attachmentUrl2: attachmentUrl2 }),
      });
      
      router.push('/success');
    } catch (error) {
      console.error("데이터 저장 오류: ", error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "데이터 저장 중 오류가 발생했습니다. 나중에 다시 시도해주세요.",
      });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <AlertDialog open={showFamilyCareAlert} onOpenChange={setShowFamilyCareAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>가족돌봄휴가 안내</AlertDialogTitle>
            <AlertDialogDescription style={{ whiteSpace: 'pre-wrap' }}>
              {"가족돌봄휴가 신청 시 다음 서류를 첨부해 주셔야 합니다.\n\n1. 가족관계증명서 또는 등본\n2. 증빙자료 첨부 必"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowFamilyCareAlert(false)}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="approverPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>결재자 직책</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="직책 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="팀장">팀장</SelectItem>
                          <SelectItem value="지점장">지점장</SelectItem>
                          <SelectItem value="센터장">센터장</SelectItem>
                          <SelectItem value="본사팀장">본사팀장</SelectItem>
                          <SelectItem value="기업금융센터장">기업금융센터장</SelectItem>
                          <SelectItem value="부장">부장</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="approverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>결재자 이름</FormLabel>
                      <FormControl>
                        <Input placeholder="이름을 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="leaveType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>휴가 종류</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === "가족돌봄휴가") {
                          setShowFamilyCareAlert(true);
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="휴가 종류를 선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="연차">연차</SelectItem>
                        <SelectItem value="반차(오전)">반차(오전)</SelectItem>
                        <SelectItem value="반차(오후)">반차(오후)</SelectItem>
                        <SelectItem value="경조 휴가">경조 휴가</SelectItem>
                        <SelectItem value="반반차(오전)">반반차(오전)</SelectItem>
                        <SelectItem value="반반차(오후)">반반차(오후)</SelectItem>
                        <SelectItem value="공가">공가</SelectItem>
                        <SelectItem value="공가(오전)">공가(오전)</SelectItem>
                        <SelectItem value="공가(오후)">공가(오후)</SelectItem>
                        <SelectItem value="가족돌봄휴가">가족돌봄휴가</SelectItem>
                        <SelectItem value="지각">지각</SelectItem>
                        <SelectItem value="조퇴">조퇴</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>휴가 기간</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (
                              field.value.to ? (
                                <>
                                  {format(field.value.from, "PPP", { locale: ko })} -{" "}
                                  {format(field.value.to, "PPP", { locale: ko })}
                                </>
                              ) : (
                                format(field.value.from, "PPP", { locale: ko })
                              )
                            ) : (
                              <span>날짜를 선택하세요</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={field.value?.from}
                          selected={field.value}
                          onSelect={field.onChange}
                          numberOfMonths={2}
                          locale={ko}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>총일수</Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {totalDays}일
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>영업일수</Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    {businessDays}일
                  </div>
                </div>
              </div>

              {showTimeInputs && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>시작 시간</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>종료 시간</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>사유 (선택)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="휴가 사유를 입력하세요"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비상 연락망 (선택)</FormLabel>
                    <FormControl>
                      <Input placeholder="비상 시 연락할 번호를 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>장소 (선택)</FormLabel>
                    <FormControl>
                      <Input placeholder="휴가 중 머무는 장소를 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isFamilyCareLeave ? (
                <>
                  <FormField
                    control={form.control}
                    name="attachment"
                    render={() => (
                      <FormItem>
                        <FormLabel>파일 첨부 1 (선택)</FormLabel>
                        <FormControl>
                          <Input type="file" {...fileRef} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="attachment2"
                    render={() => (
                       <FormItem>
                        <FormLabel>파일 첨부 2 (선택)</FormLabel>
                        <FormControl>
                          <Input type="file" {...fileRef2} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="attachment"
                  render={() => (
                    <FormItem>
                      <FormLabel>파일 첨부 (선택)</FormLabel>
                      <FormControl>
                        <Input type="file" {...fileRef} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isUploading}>
                {isUploading ? "업로드 중..." : form.formState.isSubmitting ? "제출 중..." : "제출하기"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  )
}
