import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { theme } from "@/styles/theme";
import Toast from "@/components/Toast";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { dbOperations } from "@/lib/database";
import BookingForm from "@/components/BookingForm";
import { cancelBookingNotifications } from "@/utils/notifications";
import CustomAlert from "@/components/CustomAlert";

export default function BookingDetails() {
  const router = useRouter();
  const { session } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

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

  const handleEdit = () => {
    router.push(`/bookings/${id}/edit`);
  };

  const handleDelete = () => {
    setShowDeleteAlert(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (!id || !session?.user?.id) return;
      setDeleteLoading(true);

      await dbOperations.deleteBooking(id.toString());
      await cancelBookingNotifications(id.toString());

      Toast.show({
        type: "success",
        message: "Booking deleted successfully",
      });

      router.back();
    } catch (error) {
      console.error("Error deleting booking:", error);
      Toast.show({
        type: "error",
        message: "Failed to delete booking",
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteAlert(false);
    }
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
        mode="view"
        onBack={() => router.back()}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleteLoading={deleteLoading}
      />
      <CustomAlert
        visible={showDeleteAlert}
        title="Delete Booking"
        message="Are you sure you want to delete this booking?"
        onCancel={() => setShowDeleteAlert(false)}
        onConfirm={handleConfirmDelete}
      />
    </ScreenWrapper>
  );
}
