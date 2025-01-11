import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";

// Data model interfaces
// Represents a user in the system with basic profile information
export interface User {
  id: string;
  email: string;
  password: string; // Note: This should be hashed before storage
  name: string;
  country_code?: string;
  phone_number?: string;
  address?: string;
  gender?: string;
  birthday?: string;
  image?: string;
  created_at: string;
}

// Represents a phone number associated with a user
// Users can have multiple phone numbers with different types
export interface PhoneNumber {
  id: string;
  user_id: string;
  country_code: string;
  phone_number: string;
  phone_type: "Primary" | "Secondary" | "Other";
}

// Represents a booking in the system with all its details
export interface Booking {
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
  money: number;
  advance: number;
  payment_amount: number;
  payment_status: string;
  oil_status: string;
  booking_status: string;
  return_type: "One-way" | "Both-ways";
  extras: string | null;
  created_at: string;
}

// Update Document interface
export interface Document {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_type: string;
  expiry_date: string;
  comments: string | null;
  created_at: string;
}

// Database configuration
const DATABASE_NAME = "tinkuji.db";
// Database singleton instance
let db: SQLite.SQLiteDatabase | null = null;

// Initialize and get the database instance
// This ensures we only create one connection to the database
export const initializeDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return db;
};

// Get the existing database instance without initialization
export const getDB = () => {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
};

// Define the target database version
const TARGET_DB_VERSION = 1;

// Migration function
const migrateDatabase = async (
  database: SQLite.SQLiteDatabase,
  currentVersion: number
) => {
  if (currentVersion < 1) {
    // Migration from version 0 to 1
    await database.runAsync(`
      CREATE TABLE todos (
        id INTEGER PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        intValue INTEGER
      );
    `);
    // Insert initial data or perform necessary setup
    await database.runAsync(
      "INSERT INTO todos (value, intValue) VALUES (?, ?)",
      "hello",
      1
    );
    await database.runAsync(
      "INSERT INTO todos (value, intValue) VALUES (?, ?)",
      "world",
      2
    );
    // Update user_version
    await database.runAsync(`PRAGMA user_version = 1;`);
  }
};

// Initialize database tables with PRAGMA settings and indexes
export const initDatabase = async (): Promise<boolean> => {
  const database = await initializeDB();
  if (!database) {
    throw new Error("Failed to initialize database");
  }

  try {
    // Enable Write-Ahead Logging for better performance
    await database.runAsync(`PRAGMA journal_mode = WAL;`);

    // Enforce foreign key constraints
    await database.runAsync(`PRAGMA foreign_keys = ON;`);

    // Check current database version
    const versionResult = await database.getFirstAsync<{
      user_version: number;
    }>("PRAGMA user_version;");
    const currentVersion = versionResult?.user_version || 0;

    // Run migrations if needed
    if (currentVersion < TARGET_DB_VERSION) {
      await migrateDatabase(database, currentVersion);
    }

    // Create users table first (since other tables reference it)
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        country_code TEXT,
        phone_number TEXT,
        address TEXT,
        gender TEXT,
        birthday TEXT,
        image TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // Create user_phones table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS user_phones (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        country_code TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        phone_type TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // Create bookings table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        from_location TEXT NOT NULL,
        to_location TEXT NOT NULL,
        departure_date TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        arrival_date TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_contact TEXT NOT NULL,
        driver_name TEXT,
        driver_contact TEXT,
        owner_name TEXT,
        owner_contact TEXT,
        money REAL,
        advance REAL,
        payment_amount REAL,
        payment_status TEXT,
        oil_status TEXT,
        booking_status TEXT,
        return_type TEXT,
        extras TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // Create documents table
    await database.runAsync(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        comments TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // Create indexes
    await database.runAsync(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_user_phones_user_id ON user_phones(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
    `);

    // Update database version
    await database.runAsync(`PRAGMA user_version = ${TARGET_DB_VERSION};`);

    console.log("Database initialized and migrated successfully");
    return true;
  } catch (error) {
    console.error("Error during database initialization or migration:", error);
    throw error;
  }
};

// Helper function to save files locally with overwrite prevention
export const saveFile = async (
  uri: string,
  fileName: string
): Promise<string> => {
  try {
    // Define the directory path
    const directory = `${FileSystem.documentDirectory}files/`;
    const dirInfo = await FileSystem.getInfoAsync(directory);

    // Create the directory if it doesn't exist
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }

    // Define the full file URI
    const fileUri = `${directory}${fileName}`;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    // Check if the file already exists
    if (fileInfo.exists) {
      throw new Error(`File "${fileName}" already exists.`);
    }

    // Copy the file to the app's directory
    await FileSystem.copyAsync({
      from: uri,
      to: fileUri,
    });

    return fileUri;
  } catch (error) {
    console.error("Error saving file:", error);
    throw error;
  }
};

// Define allowed fields for updates
const allowedUserFields: (keyof User)[] = [
  "email",
  "password",
  "name",
  "country_code",
  "phone_number",
  "address",
  "gender",
  "birthday",
  "image",
];

const allowedBookingFields: (keyof Booking)[] = [
  "user_id",
  "from_location",
  "to_location",
  "departure_date",
  "departure_time",
  "arrival_date",
  "arrival_time",
  "customer_name",
  "customer_contact",
  "driver_name",
  "driver_contact",
  "owner_name",
  "owner_contact",
  "money",
  "advance",
  "payment_amount",
  "payment_status",
  "oil_status",
  "booking_status",
  "return_type",
  "extras",
];

// Database operations object containing all database operations
export const dbOperations = {
  // User operations
  // Create a new user in the database
  createUser: async (user: User): Promise<void> => {
    const database = getDB();

    await database.runAsync(
      "INSERT INTO users (id, email, password, name, created_at) VALUES (?, ?, ?, ?, ?)",
      [user.id, user.email, user.password, user.name, user.created_at]
    );
  },

  // Get a user by email for authentication
  getUser: async (email: string): Promise<User | null> => {
    const database = getDB();

    const user = await database.getFirstAsync<User>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    return user || null;
  },

  // Update user profile
  updateUser: async (userId: string, user: Partial<User>): Promise<void> => {
    const database = getDB();

    const keys = Object.keys(user)
      .filter(
        (key) => key !== "id" && allowedUserFields.includes(key as keyof User)
      )
      .map((key) => key as keyof User);

    if (keys.length === 0) {
      throw new Error("No valid fields provided for update.");
    }

    const values = keys.map((key) =>
      user[key] === undefined ? null : user[key]
    );

    const setClause = keys.map((key) => `${key} = ?`).join(", ");

    await database.runAsync(`UPDATE users SET ${setClause} WHERE id = ?`, [
      ...values,
      userId,
    ]);
  },

  // Phone number operations
  // Add a new phone number for a user
  addPhone: async (phone: PhoneNumber): Promise<void> => {
    const database = getDB();

    await database.runAsync(
      `INSERT INTO user_phones (
        id, user_id, country_code, phone_number, phone_type
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        phone.id,
        phone.user_id,
        phone.country_code,
        phone.phone_number,
        phone.phone_type,
      ]
    );
  },

  // Get all phone numbers for a user
  getPhones: async (userId: string): Promise<PhoneNumber[]> => {
    const database = getDB();

    return await database.getAllAsync<PhoneNumber>(
      "SELECT * FROM user_phones WHERE user_id = ?",
      [userId]
    );
  },

  // Delete a phone number
  deletePhone: async (phoneId: string): Promise<void> => {
    const database = getDB();

    await database.runAsync("DELETE FROM user_phones WHERE id = ?", [phoneId]);
  },

  // Booking operations
  // Create a new booking
  createBooking: async (booking: Booking): Promise<void> => {
    const database = getDB();

    await database.runAsync(
      `INSERT INTO bookings (
        id, user_id, from_location, to_location, departure_date, departure_time,
        arrival_date, arrival_time, customer_name, customer_contact,
        driver_name, driver_contact, owner_name, owner_contact,
        money, advance, payment_amount, payment_status, oil_status,
        booking_status, return_type, extras, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        booking.id,
        booking.user_id,
        booking.from_location,
        booking.to_location,
        booking.departure_date,
        booking.departure_time,
        booking.arrival_date,
        booking.arrival_time,
        booking.customer_name,
        booking.customer_contact,
        booking.driver_name || null,
        booking.driver_contact || null,
        booking.owner_name || null,
        booking.owner_contact || null,
        booking.money,
        booking.advance,
        booking.payment_amount,
        booking.payment_status,
        booking.oil_status,
        booking.booking_status,
        booking.return_type,
        booking.extras || null,
        booking.created_at,
      ]
    );
  },

  // Get all bookings for a user
  getBookings: async (userId: string): Promise<Booking[]> => {
    const database = getDB();

    return await database.getAllAsync<Booking>(
      "SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
  },

  // Update an existing booking
  updateBooking: async (
    bookingId: string,
    booking: Partial<Booking>
  ): Promise<void> => {
    const database = getDB();

    const keys = Object.keys(booking)
      .filter(
        (key) =>
          key !== "id" && allowedBookingFields.includes(key as keyof Booking)
      )
      .map((key) => key as keyof Booking);

    if (keys.length === 0) {
      throw new Error("No valid fields provided for update.");
    }

    const values = keys.map((key) =>
      booking[key] === undefined ? null : booking[key]
    );

    const setClause = keys.map((key) => `${key} = ?`).join(", ");

    await database.runAsync(`UPDATE bookings SET ${setClause} WHERE id = ?`, [
      ...values,
      bookingId,
    ]);
  },

  // Delete a booking
  deleteBooking: async (id: string): Promise<void> => {
    const database = getDB();
    try {
      await database.runAsync("DELETE FROM bookings WHERE id = ?", [id]);
      console.log("Booking deleted successfully:", id);
    } catch (error: any) {
      console.error("Error deleting booking:", error);
      throw new Error(error?.message || "Failed to delete booking");
    }
  },

  // Document operations
  createDocument: async (document: Document): Promise<void> => {
    const database = getDB();
    try {
      await database.runAsync(
        `INSERT INTO documents (
          id, user_id, name, file_path, file_type, expiry_date, comments, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          document.id,
          document.user_id,
          document.name,
          document.file_path,
          document.file_type,
          document.expiry_date,
          document.comments || null,
          document.created_at,
        ]
      );
      console.log("Document created successfully:", document.id);
    } catch (error: any) {
      console.error("Error creating document:", error);
      throw new Error(error?.message || "Failed to create document");
    }
  },

  updateDocument: async (
    documentId: string,
    document: Document
  ): Promise<void> => {
    const database = getDB();
    try {
      await database.runAsync(
        `UPDATE documents SET
          name = ?,
          file_path = ?,
          file_type = ?,
          expiry_date = ?,
          comments = ?
        WHERE id = ?`,
        [
          document.name,
          document.file_path,
          document.file_type,
          document.expiry_date,
          document.comments || null,
          documentId,
        ]
      );
      console.log("Document updated successfully:", documentId);
    } catch (error: any) {
      console.error("Error updating document:", error);
      throw new Error(error?.message || "Failed to update document");
    }
  },

  getDocuments: async (userId: string): Promise<Document[]> => {
    const database = getDB();
    try {
      const documents = await database.getAllAsync<Document>(
        "SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC",
        [userId]
      );
      return documents;
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      throw new Error(error?.message || "Failed to fetch documents");
    }
  },

  deleteDocument: async (id: string): Promise<void> => {
    try {
      const database = getDB();

      // First get the document to get its file path
      const doc = await database.getFirstAsync<{ file_path: string }>(
        "SELECT file_path FROM documents WHERE id = ?",
        [id]
      );

      if (doc) {
        // Delete the file from storage
        try {
          await FileSystem.deleteAsync(doc.file_path);
        } catch (error) {
          console.error("Error deleting file:", error);
        }
      }

      // Delete the document from database
      await database.runAsync("DELETE FROM documents WHERE id = ?", [id]);

      console.log("Document deleted successfully:", id);
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  },
};
