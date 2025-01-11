import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { theme } from "@/styles/theme";
import Toast from "@/components/Toast";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { dbOperations } from "@/lib/database";
import BookingForm from "@/components/BookingForm";
import { scheduleBookingNotifications } from "@/utils/notifications";

export default function EditBookingScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [showPicker, setShowPicker] = useState({
    departureDate: false,
    departureTime: false,
    arrivalDate: false,
    arrivalTime: false,
  });

  // Get booking ID from route params
  const { id } = useLocalSearchParams();

  // Fetch booking data when component mounts
  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      if (!id || !session?.user?.id) return;

      const bookings = await dbOperations.getBookings(session.user.id);
      const booking = bookings.find((b) => b.id === id.toString());

      if (!booking) {
        throw new Error("Booking not found");
      }

      setBooking(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      Toast.show({
        type: "error",
        message: "Failed to fetch booking details",
      });
      router.back();
    }
  };

  const handleSave = async () => {
    try {
      if (!id || !session?.user?.id) return;
      setLoading(true);

      await dbOperations.updateBooking(id.toString(), booking);
      await scheduleBookingNotifications(booking);

      Toast.show({
        type: "success",
        message: "Booking updated successfully",
      });

      router.back();
    } catch (error) {
      console.error("Error updating booking:", error);
      Toast.show({
        type: "error",
        message: "Failed to update booking",
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
        setBooking((prev: any) => ({
          ...prev,
          [field]: format(selectedDate, "yyyy-MM-dd"),
        }));
      } else if (field.includes("time")) {
        setBooking((prev: any) => ({
          ...prev,
          [field]: format(selectedDate, "HH:mm:ss"),
        }));
      }
    } else {
      setShowPicker((prev) => ({ ...prev, [field]: false }));
    }
  };

  const onInputChange = (field: string, value: any) => {
    setBooking((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!booking) {
    return (
      <ScreenWrapper bg="white" hideHeader>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

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
