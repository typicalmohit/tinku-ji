import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Document, Booking } from "@/lib/database";
import { parseISO } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Configure Android channels
const configureNotificationChannels = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("document-expiry", {
      name: "Document Expiry",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      enableVibrate: true,
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync("booking-reminder", {
      name: "Booking Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4CAF50",
      enableVibrate: true,
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
};

// Request permissions
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }

  await configureNotificationChannels();
  return true;
};

// Generic store notification schedule
const storeNotificationSchedule = async (
  key: string,
  scheduleIds: string[]
) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(scheduleIds));
  } catch (error) {
    console.error("Error storing notification schedule:", error);
  }
};

// Generic get notification schedule
const getNotificationSchedule = async (key: string): Promise<string[]> => {
  try {
    const schedule = await AsyncStorage.getItem(key);
    return schedule ? JSON.parse(schedule) : [];
  } catch (error) {
    console.error("Error getting notification schedule:", error);
    return [];
  }
};

// Generic cancel notifications
const cancelNotifications = async (key: string) => {
  try {
    const scheduleIds = await getNotificationSchedule(key);
    for (const identifier of scheduleIds) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    }
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Error canceling notifications:", error);
  }
};

// Common notification scheduling function
const scheduleNotifications = async ({
  id,
  type,
  date,
  notificationDays,
  getMessage,
  storageKey,
}: {
  id: string;
  type: "document" | "booking";
  date: Date;
  notificationDays: number[];
  getMessage: (daysRemaining: number) => { title: string; body: string };
  storageKey: string;
}) => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await cancelNotifications(storageKey);

    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const targetDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const daysUntilTarget = Math.floor(
      (targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const scheduleIds: string[] = [];

    for (const daysRemaining of notificationDays.filter(
      (d) => d <= daysUntilTarget
    )) {
      const notificationDate = new Date(targetDate);
      notificationDate.setDate(notificationDate.getDate() - daysRemaining);
      notificationDate.setHours(9, 0, 0, 0);

      const now = new Date();
      if (notificationDate.getTime() > now.getTime()) {
        const identifier = `${type}-${id}-${daysRemaining}d`;
        const message = getMessage(daysRemaining);

        const trigger =
          Platform.OS === "ios"
            ? {
                type: "calendar",
                date: notificationDate,
                repeats: false,
              }
            : {
                type: "timeInterval",
                seconds: Math.floor(
                  (notificationDate.getTime() - now.getTime()) / 1000
                ),
                repeats: false,
              };

        await Notifications.scheduleNotificationAsync({
          content: {
            title: message.title,
            body: message.body,
            data: { [`${type}Id`]: id },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: trigger as any,
          identifier,
        });

        scheduleIds.push(identifier);
      }
    }

    await storeNotificationSchedule(storageKey, scheduleIds);
  } catch (error) {
    console.error("Error scheduling notifications:", error);
  }
};

// Schedule notifications for document expiry
export const scheduleDocumentExpiryNotifications = async (
  document: Document
) => {
  const expiryDate = parseISO(document.expiry_date);
  const storageKey = `notification_schedule_${document.id}`;

  await scheduleNotifications({
    id: document.id,
    type: "document",
    date: expiryDate,
    notificationDays: [30, 15, 5, 3, 2, 1, 0],
    getMessage: (daysRemaining) => ({
      title: "Document Expiry Reminder",
      body:
        daysRemaining === 0
          ? `Your document "${document.name}" expires today!`
          : `Your document "${
              document.name
            }" will expire in ${daysRemaining} day${
              daysRemaining > 1 ? "s" : ""
            }!`,
    }),
    storageKey,
  });
};

// Schedule notifications for booking
export const scheduleBookingNotifications = async (booking: Booking) => {
  const [year, month, day] = booking.departure_date.split("-").map(Number);
  const departureDate = new Date(year, month - 1, day);
  const storageKey = `booking_notification_schedule_${booking.id}`;

  await scheduleNotifications({
    id: booking.id,
    type: "booking",
    date: departureDate,
    notificationDays: [7, 3, 2, 1, 0],
    getMessage: (daysRemaining) => ({
      title: "Booking Reminder",
      body:
        daysRemaining === 0
          ? `Your booking from ${booking.from_location} to ${booking.to_location} is today!`
          : `Your booking from ${booking.from_location} to ${
              booking.to_location
            } is in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}!`,
    }),
    storageKey,
  });
};

// Export these for backward compatibility
export const cancelDocumentNotifications = (documentId: string) =>
  cancelNotifications(`notification_schedule_${documentId}`);

export const cancelBookingNotifications = (bookingId: string) =>
  cancelNotifications(`booking_notification_schedule_${bookingId}`);

// Test notification function
export const sendTestNotification = async () => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "This is a test notification!",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });

    return true;
  } catch (error) {
    console.error("Error sending test notification:", error);
    return false;
  }
};

// Send test notification for next booking
export const sendNextBookingTestNotification = async (booking: Booking) => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    const departureDate = new Date(
      `${booking.departure_date}T${booking.departure_time}`
    );

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Next Booking Reminder",
        body: `Your next booking from ${booking.from_location} to ${
          booking.to_location
        } is scheduled for ${departureDate.toLocaleString()}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });

    return true;
  } catch (error) {
    console.error("Error sending test notification:", error);
    return false;
  }
};
