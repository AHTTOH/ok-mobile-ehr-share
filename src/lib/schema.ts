import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "유효한 이메일을 입력해주세요." }),
  password: z.string().min(1, { message: "비밀번호를 입력해주세요." }),
});

export const leaveRequestSchema = z.object({
  approverPosition: z.string({
    required_error: "결재자 직책을 선택해주세요.",
  }),
  approverName: z.string().min(1, { message: "결재자 이름을 입력해주세요." }),
  leaveType: z.string({
    required_error: "휴가 종류를 선택해주세요.",
  }),
  dateRange: z.object({
    from: z.date({ required_error: "시작일을 선택해주세요." }),
    to: z.date().optional(),
  }, { required_error: "날짜를 선택해주세요." }),
  reason: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  emergencyContact: z.string().optional(),
  location: z.string().optional(),
  attachment: z.any().optional(),
  attachment2: z.any().optional(),
});


export const overtimeRequestSchema = z.object({
  date: z.date({
    required_error: "날짜를 선택해주세요.",
  }),
  startTime: z.string({ required_error: "시작 시간을 입력해주세요."}).min(1, "시작 시간을 입력해주세요."),
  endTime: z.string({ required_error: "종료 시간을 입력해주세요."}).min(1, "종료 시간을 입력해주세요."),
  reason: z.string().optional(),
});

export const businessTripRequestSchema = z.object({
  destination: z.string().min(1, { message: "출장지를 입력해주세요." }),
  dateRange: z.object({
    from: z.date({ required_error: "시작일을 선택해주세요." }),
    to: z.date().optional(),
  }, { required_error: "날짜를 선택해주세요." }),
  reason: z.string().optional(),
});

export const resetPasswordSchema = z.object({
    password: z.string().min(6, { message: "비밀번호는 6자 이상이어야 합니다." }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

export const resignationSchema = z.object({
  resignationDate: z.date({
    required_error: "퇴사 예정일을 선택해주세요.",
  }),
  reason: z.string().min(1, { message: "사직 사유를 입력해주세요." }),
  confirm: z.literal(true, {
    errorMap: () => ({ message: "사직서 제출 확인란에 체크해주세요." }),
  }),
});

export const condoReservationSchema = z.object({
  condoType: z.string({
    required_error: "희망 콘도 종류를 선택해주세요.",
  }),
  reservationDate: z.date({
    required_error: "예약 날짜를 선택해주세요.",
  }),
  roomType: z.string({
    required_error: "방 종류를 선택해주세요.",
  }),
});
