import React, { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { dbOperations } from "@/lib/database";
import Toast from "@/components/Toast";
import ScreenWrapper from "@/components/ScreenWrapper";
import BookingForm from "@/components/BookingForm";
import { generateUUID } from "@/utils/common";
import { Booking } from "@/lib/database";
import { scheduleBookingNotifications } from "@/utils/notifications";

export default function NewBookingScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState({
    departureDate: false,
    departureTime: false,
    arrivalDate: false,
    arrivalTime: false,
  });

  const defaultBooking: Booking = {
    id: generateUUID(),
    user_id: session?.user?.id || "",
    from_location: "",
    to_location: "",
    departure_date: format(new Date(), "yyyy-MM-dd"),
    departure_time: format(new Date(), "HH:mm:ss"),
    arrival_date: format(new Date(), "yyyy-MM-dd"),
    arrival_time: format(new Date(), "HH:mm:ss"),
    customer_name: "",
    customer_contact: "",
    driver_name: "",
    driver_contact: "",
    owner_name: "",
    owner_contact: "",
    money: 0,
    advance: 0,
    payment_amount: 0,
    payment_status: "pending",
    oil_status: "not_included",
    booking_status: "confirm",
    return_type: "One-way",
    extras: "",
    created_at: new Date().toISOString(),
  };

  const [booking, setBooking] = useState<Booking>(defaultBooking);

  const handleSave = async () => {
    try {
      if (!session?.user?.id) return;
      setLoading(true);

      const newBooking: Booking = {
        ...booking,
        user_id: session.user.id,
        created_at: new Date().toISOString(),
        money: parseFloat(booking.money.toString()) || 0,
        advance: parseFloat(booking.advance.toString()) || 0,
        payment_amount: parseFloat(booking.payment_amount.toString()) || 0,
      };

      await dbOperations.createBooking(newBooking);
      await scheduleBookingNotifications(newBooking);

      Toast.show({
        type: "success",
        message: "Booking created successfully",
      });

      router.back();
    } catch (error) {
      console.error("Error creating booking:", error);
      Toast.show({
        type: "error",
        message: "Failed to create booking",
      });
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (
    event: any,
    selectedDate: Date | undefined,
    field: string
  ) => {
    if (event.type === "set" && selectedDate) {
      setShowPicker((prev) => ({ ...prev, [field]: false }));

      if (field.includes("date")) {
        setBooking((prev) => ({
          ...prev,
          [field]: format(selectedDate, "yyyy-MM-dd"),
        }));
      } else if (field.includes("time")) {
        setBooking((prev) => ({
          ...prev,
          [field]: format(selectedDate, "HH:mm:ss"),
        }));
      }
    } else {
      setShowPicker((prev) => ({ ...prev, [field]: false }));
    }
  };

  const onInputChange = (field: string, value: any) => {
    setBooking((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <ScreenWrapper bg="white" hideHeader>
      <BookingForm
        booking={booking}
        mode="edit"
        onBack={() => router.back()}
        onSave={handleSave}
        onCancel={() => router.back()}
        loading={loading}
        showPicker={showPicker}
        setShowPicker={setShowPicker}
        onDateChange={onDateChange}
        onInputChange={onInputChange}
      />
    </ScreenWrapper>
  );
}
