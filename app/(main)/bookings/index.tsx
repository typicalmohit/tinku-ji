import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/styles/theme";
import Toast from "@/components/Toast";
import { styles } from "@/styles/bookings";
import { Dropdown } from "react-native-element-dropdown";
import { format } from "date-fns";
import { getStatusColor } from "@/utils/statusColors";
import { dbOperations } from "@/lib/database";

interface Booking {
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
  return_type: "One-way" | "Both-ways";
  extras: string | null;
}

const formatDateTime = (dateStr: string, timeStr: string) => {
  try {
    // For date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { date: "Invalid date", time: "Invalid time" };
    }

    // For time
    const [hours, minutes] = timeStr.split(":");
    const time = new Date();
    time.setHours(parseInt(hours, 10), parseInt(minutes, 10));

    if (isNaN(time.getTime())) {
      return { date: format(date, "dd/MM/yyyy"), time: "Invalid time" };
    }

    return {
      date: format(date, "dd/MM/yyyy"),
      time: format(time, "HH:mm"),
    };
  } catch (error) {
    console.error("Date formatting error:", error);
    return { date: "Invalid date", time: "Invalid time" };
  }
};

const BookingCard = ({ booking }: { booking: Booking }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const departure = formatDateTime(
    booking.departure_date,
    booking.departure_time
  );

  return (
    <Pressable
      style={styles.cardContent}
      onPress={() => router.push(`/bookings/${booking.id}`)}
    >
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{departure.date}</Text>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusColor(
                    booking.booking_status,
                    "booking"
                  ),
                },
              ]}
            >
              <Text style={styles.statusText}>
                {booking.booking_status.toUpperCase()}
              </Text>
            </View>
            <Pressable
              style={styles.expandButton}
              onPress={() => setExpanded(!expanded)}
            >
              <MaterialIcons
                name={expanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={24}
                color={theme.colors.textLight}
              />
            </Pressable>
          </View>
        </View>
        <View style={styles.routeContainer}>
          <Text style={styles.locationText}>
            {booking.from_location} → {booking.to_location}
          </Text>
        </View>

        <View style={styles.customerInfo}>
          <Text style={styles.nameText}>{booking.customer_name}</Text>
          <Text style={styles.phoneText}>{booking.customer_contact}</Text>
        </View>

        {expanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            <View style={styles.paymentInfo}>
              <Text style={styles.moneyText}>Total: ₹{booking.money}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(
                      booking.payment_status,
                      "payment"
                    ),
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {`PAYMENT ${booking.payment_status.toUpperCase()}`}
                </Text>
              </View>
            </View>

            <View style={styles.driverInfo}>
              <Text style={styles.driverText}>
                Driver: {booking.driver_name || "Not set"}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(booking.oil_status, "oil"),
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {`OIL ${booking.oil_status.toUpperCase()}`}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
};

export default function BookingsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "MMMM")
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchBookings = async () => {
    try {
      if (!session?.user?.id) return;

      const data = await dbOperations.getBookings(session.user.id);
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      Toast.show({
        type: "error",
        message: "Failed to load bookings",
      });
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBookings();
    }, [session?.user?.id])
  );

  const groupBookingsByMonth = () => {
    const filteredBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.departure_date);
      const bookingMonth = format(bookingDate, "MMMM");
      const bookingYear = bookingDate.getFullYear();

      return (
        (selectedMonth === "All" || bookingMonth === selectedMonth) &&
        bookingYear === selectedYear
      );
    });

    // Sort bookings by departure date and time
    filteredBookings.sort((a, b) => {
      const dateA = new Date(`${a.departure_date}T${a.departure_time}`);
      const dateB = new Date(`${b.departure_date}T${b.departure_time}`);
      return dateA.getTime() - dateB.getTime();
    });

    const grouped = filteredBookings.reduce((acc, booking) => {
      const month = format(new Date(booking.departure_date), "MMMM yyyy");
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(booking);
      return acc;
    }, {} as Record<string, Booking[]>);

    return Object.entries(grouped).map(([month, bookings]) => ({
      month,
      bookings,
    }));
  };

  return (
    <ScreenWrapper bg="#d9cec1" hideHeader>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookings</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/bookings/new")}
        >
          <MaterialIcons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add New</Text>
        </Pressable>
      </View>

      {/* Filters Card */}
      <View style={styles.filtersCard}>
        <View style={styles.filterItem}>
          <MaterialIcons
            name="event"
            size={20}
            color={theme.colors.textLight}
          />
          <View style={styles.pickerContainer}>
            <Dropdown
              style={styles.dropDownPicker}
              containerStyle={styles.dropDownContainer}
              data={[
                { label: "All Months", value: "All" },
                ...Array.from({ length: 12 }, (_, i) => ({
                  label: format(new Date(2020, i, 1), "MMMM"),
                  value: format(new Date(2020, i, 1), "MMMM"),
                })),
              ]}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropDownItemText}
              value={selectedMonth}
              onChange={(item) => setSelectedMonth(item.value)}
              placeholder="Select Month"
              placeholderStyle={styles.dropDownText}
              selectedTextStyle={styles.dropDownText}
              maxHeight={200}
            />
          </View>
        </View>

        <View style={styles.filterDivider} />

        <View style={styles.filterItem}>
          <MaterialIcons
            name="calendar-today"
            size={20}
            color={theme.colors.textLight}
          />
          <View style={styles.pickerContainer}>
            <Dropdown
              style={styles.dropDownPicker}
              containerStyle={styles.dropDownContainer}
              data={Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() + i;
                return {
                  label: year.toString(),
                  value: year.toString(),
                };
              })}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropDownItemText}
              value={selectedYear.toString()}
              onChange={(item) => setSelectedYear(parseInt(item.value))}
              placeholder="Select Year"
              placeholderStyle={styles.dropDownText}
              selectedTextStyle={styles.dropDownText}
              maxHeight={200}
            />
          </View>
        </View>
      </View>

      {/* Bookings List */}
      <ScrollView style={styles.container}>
        {bookings.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No bookings found for{" "}
              {selectedMonth === "All" ? "" : `${selectedMonth} `}
              {selectedYear}
            </Text>
          </View>
        ) : (
          groupBookingsByMonth().map((group) => (
            <View key={group.month} style={styles.monthGroup}>
              <Text style={styles.monthTitle}>{group.month}</Text>
              {group.bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
