import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { dbOperations } from "@/lib/database";
import { useAuth } from "@/contexts/AuthContext";
import Toast from "@/components/Toast";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import ViewBooking from "./view";

interface BookingData {
  id: string;
  user_id: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  departure_time: string;
  arrival_date: string;
  arrival_time: string;
  customer_name: string;
  customer_contact: string;
  driver_name: string | null;
  driver_contact: string | null;
  owner_name: string | null;
  owner_contact: string | null;
  created_at: string;
  money: number;
  advance: number;
  booking_status: string;
  payment_amount: number;
  payment_status: string;
  oil_status: string;
  return_type: string;
  extras: string | null;
}

export default function BookingDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingData | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (!id) {
        Toast.show({
          type: "error",
          message: "Invalid booking ID",
        });
        router.back();
        return;
      }
      fetchBookingDetails();
    }, [id])
  );

  const fetchBookingDetails = async () => {
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
        message: "Failed to load booking details",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/bookings/${id}/edit`);
  };

  if (loading) {
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

  if (!booking) {
    return null;
  }

  return (
    <ScreenWrapper bg="white" hideHeader>
      <View style={{ flex: 1 }}>
        <ViewBooking
          booking={booking}
          onEdit={handleEdit}
          onBack={() => router.back()}
        />
      </View>
    </ScreenWrapper>
  );
}
