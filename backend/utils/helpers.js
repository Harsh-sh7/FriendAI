// Utility helpers
import mongoose from 'mongoose';

// Convert string ID to ObjectId
export const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    return id; // Return as-is if conversion fails
  }
};

// Safely get ISO string from date
export const toISOString = (date) => {
  if (!date) return null;
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return String(date);
};
