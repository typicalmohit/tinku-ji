import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { theme } from "@/styles/theme";
import { styles } from "@/styles/bookings";
import { getStatusColor } from "@/utils/statusColors";
import Button from "@/components/Button";
import { renderInput } from "@/components/FormInputs";
import { Booking } from "@/lib/database";
import Toast from "@/components/Toast";
import { format } from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";

interface BookingFormProps {
  booking: Booking;
  mode: "view" | "edit";
  onBack: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  deleteLoading?: boolean;
  showPicker?: any;
  setShowPicker?: (state: any) => void;
  onDateChange?: (event: any, date: Date | undefined, field: string) => void;
  onInputChange?: (field: keyof Booking, value: any) => void;
}

const renderContactRow = (
  nameValue: string | null,
  contactValue: string | null,
  nameField: keyof Booking,
  contactField: keyof Booking,
  mode: "view" | "edit",
  onInputChange?: (field: keyof Booking, value: any) => void
) => {
  if (mode === "view") {
    return (
      <View style={styles.detailSection}>
        <View style={styles.detailRow}>
          <View style={styles.labelContainer}>
            <MaterialIcons
              name="person"
              size={18}
              color={theme.colors.textLight}
            />
            <Text style={styles.detailLabel}>Name</Text>
          </View>
          <Text style={styles.detailValue}>{nameValue ?? "Not set"}</Text>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.labelContainer}>
            <MaterialIcons
              name="phone"
              size={18}
              color={theme.colors.textLight}
            />
            <Text style={styles.detailLabel}>Contact</Text>
          </View>
          <Text style={styles.detailValue}>{contactValue ?? "Not set"}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.detailSection}>
      <View style={styles.detailRow}>
        {renderInput(
          "Name",
          nameValue?.toString() ?? "",
          (text) => onInputChange?.(nameField, text),
          "person",
          "Name",
          "default"
        )}
      </View>
      <View style={styles.detailRow}>
        {renderInput(
          "Contact",
          contactValue?.toString() ?? "",
          (text) => onInputChange?.(contactField, text),
          "phone",
          "Contact",
          "default"
        )}
      </View>
    </View>
  );
};

export default function BookingForm({
  booking,
  mode,
  onBack,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  loading,
  deleteLoading,
  showPicker,
  setShowPicker,
  onDateChange,
  onInputChange,
}: BookingFormProps) {
  const paymentStatuses = ["pending", "partial", "completed"];
  const oilStatuses = ["not_included", "included"];
  const bookingStatuses = ["confirm", "completed", "cancelled"];
  const returnTypes = ["One-way", "Both-ways"];

  const renderStatusSelector = (
    label: string,
    value: string,
    options: string[],
    field: keyof Booking,
    icon: keyof typeof MaterialIcons.glyphMap
  ) => {
    if (mode === "view") {
      return (
        <View style={styles.detailSection}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name={icon} size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>{label}</Text>
          </View>
          <View
            style={[
              styles.statusChip,
              {
                backgroundColor: getStatusColor(value, field as any),
              },
            ]}
          >
            <MaterialIcons name={icon} size={18} />
            <Text style={styles.statusText}>{value.toUpperCase()}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.detailSection}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name={icon} size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>{label}</Text>
        </View>
        <View style={styles.statusContainer}>
          {options.map((status) => (
            <Pressable
              key={status}
              style={[
                styles.statusButton,
                value === status && styles.statusButtonActive,
              ]}
              onPress={() => onInputChange?.(field, status)}
            >
              <Text
                style={[
                  styles.statusText,
                  value === status && styles.statusTextActive,
                ]}
              >
                {status.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const renderDetailRow = (
    label: string,
    value: string | number | null,
    icon: keyof typeof MaterialIcons.glyphMap,
    field?: keyof Booking
  ) => {
    if (mode === "view") {
      return (
        <View style={styles.detailRow}>
          <View style={styles.labelContainer}>
            <MaterialIcons
              name={icon}
              size={18}
              color={theme.colors.textLight}
            />
            <Text style={styles.detailLabel}>{label}:</Text>
          </View>
          <Text style={styles.detailValue}>{value ?? "Not set"}</Text>
        </View>
      );
    }

    if (!field || !onInputChange) return null;

    return renderInput(
      label,
      value?.toString() ?? "",
      (text) => onInputChange(field, text),
      icon,
      label,
      field.includes("money") || field.includes("advance")
        ? "numeric"
        : "default"
    );
  };

  const renderDateTimeSection = (
    label: string,
    dateField: string,
    timeField: string,
    dateValue: string,
    timeValue: string
  ) => {
    if (mode === "view") {
      return renderDetailRow(
        label,
        `${booking[dateField as keyof Booking]} ${
          booking[timeField as keyof Booking]
        }`,
        "event"
      );
    }

    if (!showPicker || !setShowPicker || !onDateChange) return null;

    return (
      <View style={styles.dateTimeContainer}>
        <View style={styles.dateTimeLabelContainer}>
          <MaterialIcons name="event" size={24} color={theme.colors.primary} />
          <Text style={styles.dateLabel}>{label}</Text>
        </View>
        <View style={styles.dateTimeInputs}>
          <Pressable
            style={[styles.dateTimeButton, { flex: 1, marginRight: 8 }]}
            onPress={() =>
              setShowPicker((prev: any) => ({ ...prev, [dateField]: true }))
            }
          >
            <Text style={styles.dateTimeText}>
              {format(new Date(dateValue), "dd/MM/yyyy")}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.dateTimeButton, { flex: 1 }]}
            onPress={() =>
              setShowPicker((prev: any) => ({ ...prev, [timeField]: true }))
            }
          >
            <Text style={styles.dateTimeText}>
              {format(new Date(`2000-01-01T${timeValue}`), "HH:mm")}
            </Text>
          </Pressable>
        </View>

        {showPicker[dateField] && (
          <DateTimePicker
            value={new Date(dateValue)}
            mode="date"
            onChange={(event, date) => {
              if (event.type === "set" && date) {
                onDateChange(event, date, dateField);
              } else {
                setShowPicker((prev: any) => ({ ...prev, [dateField]: false }));
              }
            }}
          />
        )}

        {showPicker[timeField] && (
          <DateTimePicker
            value={new Date(`2000-01-01T${timeValue}`)}
            mode="time"
            onChange={(event, date) => {
              if (event.type === "set" && date) {
                onDateChange(event, date, timeField);
              } else {
                setShowPicker((prev: any) => ({ ...prev, [timeField]: false }));
              }
            }}
          />
        )}
      </View>
    );
  };

  return (
    <>
      <View style={styles.header}>
        <MaterialIcons
          name="arrow-back"
          size={24}
          color={theme.colors.textDark}
          onPress={onBack}
          style={styles.backButton}
        />
        <Text style={styles.headerTitle}>
          {mode === "view" ? "Booking Details" : "Edit Booking"}
        </Text>
        {mode === "view" ? (
          <Pressable onPress={onEdit} style={styles.iconButton}>
            <MaterialIcons name="edit" size={24} color={theme.colors.primary} />
          </Pressable>
        ) : (
          <Pressable onPress={onSave} style={styles.iconButton}>
            <MaterialIcons name="save" size={24} color={theme.colors.primary} />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          {/* Journey Details */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="directions-bus"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Journey Details</Text>
            </View>
            {renderDetailRow(
              "From",
              booking.from_location,
              "location-on",
              "from_location"
            )}
            {renderDetailRow(
              "To",
              booking.to_location,
              "location-on",
              "to_location"
            )}
            {renderDateTimeSection(
              "Departure",
              "departure_date",
              "departure_time",
              booking.departure_date,
              booking.departure_time
            )}
            {renderDateTimeSection(
              "Arrival",
              "arrival_date",
              "arrival_time",
              booking.arrival_date,
              booking.arrival_time
            )}
          </View>

          <View style={styles.divider} />

          {/* Customer Details */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="person"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Customer Details</Text>
              {mode === "edit" && (
                <Pressable
                  style={styles.contactPickerButton}
                  onPress={async () => {
                    try {
                      const { status } =
                        await Contacts.requestPermissionsAsync();
                      if (status !== "granted") {
                        Toast.show({
                          type: "error",
                          message:
                            "Please allow contact permissions to use this feature",
                        });
                        return;
                      }

                      const contact =
                        await Contacts.presentContactPickerAsync();

                      if (contact) {
                        if (contact.name && onInputChange) {
                          onInputChange("customer_name", contact.name);
                        }
                        if (
                          contact.phoneNumbers &&
                          contact.phoneNumbers.length > 0 &&
                          onInputChange
                        ) {
                          onInputChange(
                            "customer_contact",
                            contact.phoneNumbers[0].number
                          );
                        }
                      }
                    } catch (error) {
                      console.error("Error picking contact:", error);
                      Toast.show({
                        type: "error",
                        message: "Failed to pick contact",
                      });
                    }
                  }}
                >
                  <MaterialIcons
                    name="contacts"
                    size={24}
                    color={theme.colors.primary}
                  />
                </Pressable>
              )}
            </View>
            {renderContactRow(
              booking.customer_name,
              booking.customer_contact,
              "customer_name",
              "customer_contact",
              mode,
              onInputChange
            )}
          </View>

          <View style={styles.divider} />

          {/* Driver Details */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="drive-eta"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Driver Details</Text>
              {mode === "edit" && (
                <Pressable
                  style={styles.contactPickerButton}
                  onPress={async () => {
                    try {
                      const { status } =
                        await Contacts.requestPermissionsAsync();
                      if (status !== "granted") {
                        Toast.show({
                          type: "error",
                          message:
                            "Please allow contact permissions to use this feature",
                        });
                        return;
                      }

                      const contact =
                        await Contacts.presentContactPickerAsync();

                      if (contact) {
                        if (contact.name && onInputChange) {
                          onInputChange("driver_name", contact.name);
                        }
                        if (
                          contact.phoneNumbers &&
                          contact.phoneNumbers.length > 0 &&
                          onInputChange
                        ) {
                          onInputChange(
                            "driver_contact",
                            contact.phoneNumbers[0].number
                          );
                        }
                      }
                    } catch (error) {
                      console.error("Error picking contact:", error);
                      Toast.show({
                        type: "error",
                        message: "Failed to pick contact",
                      });
                    }
                  }}
                >
                  <MaterialIcons
                    name="contacts"
                    size={24}
                    color={theme.colors.primary}
                  />
                </Pressable>
              )}
            </View>
            {renderContactRow(
              booking.driver_name,
              booking.driver_contact,
              "driver_name",
              "driver_contact",
              mode,
              onInputChange
            )}
          </View>

          <View style={styles.divider} />

          {/* Owner Details */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="business"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Owner Details</Text>
              {mode === "edit" && (
                <Pressable
                  style={styles.contactPickerButton}
                  onPress={async () => {
                    try {
                      const { status } =
                        await Contacts.requestPermissionsAsync();
                      if (status !== "granted") {
                        Toast.show({
                          type: "error",
                          message:
                            "Please allow contact permissions to use this feature",
                        });
                        return;
                      }

                      const contact =
                        await Contacts.presentContactPickerAsync();

                      if (contact) {
                        if (contact.name && onInputChange) {
                          onInputChange("owner_name", contact.name);
                        }
                        if (
                          contact.phoneNumbers &&
                          contact.phoneNumbers.length > 0 &&
                          onInputChange
                        ) {
                          onInputChange(
                            "owner_contact",
                            contact.phoneNumbers[0].number
                          );
                        }
                      }
                    } catch (error) {
                      console.error("Error picking contact:", error);
                      Toast.show({
                        type: "error",
                        message: "Failed to pick contact",
                      });
                    }
                  }}
                >
                  <MaterialIcons
                    name="contacts"
                    size={24}
                    color={theme.colors.primary}
                  />
                </Pressable>
              )}
            </View>
            {renderContactRow(
              booking.owner_name,
              booking.owner_contact,
              "owner_name",
              "owner_contact",
              mode,
              onInputChange
            )}
          </View>

          <View style={styles.divider} />

          {/* Payment Details */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons
                name="payments"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle}>Payment Details</Text>
            </View>
            {renderDetailRow(
              "Total Amount",
              `₹${booking.money}`,
              "attach-money",
              "money"
            )}
            {renderDetailRow(
              "Advance",
              `₹${booking.advance}`,
              "money",
              "advance"
            )}
            {renderDetailRow(
              "Payment Amount",
              `₹${booking.payment_amount}`,
              "account-balance-wallet",
              "payment_amount"
            )}
          </View>

          <View style={styles.divider} />

          {/* Payment Status */}
          {renderStatusSelector(
            "Payment Status",
            booking.payment_status,
            paymentStatuses,
            "payment_status",
            "payment"
          )}

          <View style={styles.divider} />

          {/* Oil Status */}
          {renderStatusSelector(
            "Oil Status",
            booking.oil_status,
            oilStatuses,
            "oil_status",
            "local-gas-station"
          )}

          <View style={styles.divider} />

          {/* Booking Status */}
          {renderStatusSelector(
            "Booking Status",
            booking.booking_status,
            bookingStatuses,
            "booking_status",
            "event-available"
          )}

          <View style={styles.divider} />

          {/* Return Type */}
          {renderStatusSelector(
            "Return Type",
            booking.return_type,
            returnTypes,
            "return_type",
            "repeat"
          )}

          {/* Extras */}
          {(mode === "edit" || booking.extras) && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailSection}>
                <View style={styles.sectionHeader}>
                  <MaterialIcons
                    name="more-horiz"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Additional Details</Text>
                </View>
                {renderDetailRow("Notes", booking.extras, "notes", "extras")}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {mode === "edit" ? (
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => onCancel?.()}
            variant="secondary"
            buttonStyle={styles.cancelButton}
          />
          <Button
            title="Save Changes"
            onPress={() => onSave?.()}
            loading={loading}
            disabled={loading}
            buttonStyle={styles.saveButton}
          />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <Button
            title="Delete Booking"
            onPress={() => onDelete?.()}
            loading={deleteLoading}
            disabled={deleteLoading}
            variant="danger"
            buttonStyle={styles.deleteButton}
          />
        </View>
      )}
    </>
  );
}
