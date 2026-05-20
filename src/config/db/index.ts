import mongoose from 'mongoose';

export const connectDB = async (mongoURI: string, dbName: string) => {
  return mongoose.connect(mongoURI, {
    dbName,
  });
};
