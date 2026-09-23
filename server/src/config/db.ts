import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellmeet';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error: any) {
    isConnected = false;
    console.warn(`[Database] MongoDB connection failed (${error.message}). Running with in-memory persistence fallback.`);
    return false;
  }
};

export const getDBStatus = () => ({
  connected: isConnected,
  readyState: mongoose.connection.readyState,
  status: isConnected ? 'online' : 'in-memory-fallback',
});
