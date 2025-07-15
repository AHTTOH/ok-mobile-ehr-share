"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

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
import { Card, CardContent } from "@/components/ui/card"
import { condoReservationSchema } from "@/lib/schema"
import { condoTypes, roomTypesByCondo } from "@/lib/condo-data"

export default function CondoReservationPage() {
  const [availableRoomTypes, setAvailableRoomTypes] = useState<string[]>([]);

  const form = useForm<z.infer<typeof condoReservationSchema>>({
    resolver: zodResolver(condoReservationSchema),
  });

  const selectedCondo = form.watch("condoType");

  const handleCondoChange = (condo: string) => {
    form.setValue("condoType", condo);
    form.setValue("roomType", ""); // Reset room type when condo changes
    setAvailableRoomTypes(roomTypesByCondo[condo] || []);
  };

  function onSubmit(data: z.infer<typeof condoReservationSchema>) {
    console.log("Condo reservation submitted:", data);
    // Here you would typically call a server action to process the reservation
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="condoType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>희망 콘도 종류</FormLabel>
                  <Select onValueChange={handleCondoChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="콘도를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {condoTypes.map((condo) => (
                        <SelectItem key={condo} value={condo}>
                          {condo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reservationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>예약 날짜</FormLabel>
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
                          {field.value ? (
                            format(field.value, "PPP", { locale: ko })
                          ) : (
                            <span>날짜를 선택하세요</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        locale={ko}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roomType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>방 종류</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedCondo}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="콘도를 먼저 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoomTypes.map((room) => (
                        <SelectItem key={room} value={room}>
                          {room}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "예약 신청 중..." : "예약 신청"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
