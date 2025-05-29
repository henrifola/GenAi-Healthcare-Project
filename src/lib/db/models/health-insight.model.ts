import mongoose, { Schema, Document, Model } from 'mongoose';

interface IHealthInsights {
  summary: string;
  activity: string;
  sleep: string;
  cardioHealth: string;
  recommendations: string[];
}

export interface IHealthInsight extends Document {
  userId: string;
  date: string; // YYYY-MM-DD format
  healthDataHash: string;
  insights: IHealthInsights;
  createdAt: Date;
  updatedAt: Date;
}

const HealthInsightSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  date: { type: String, required: true, index: true },
  healthDataHash: { type: String, required: true },
  insights: { type: Object, required: true }, // Store the structured insights object
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps
});

// Compound index to ensure unique insights per user per day for a given data hash
HealthInsightSchema.index({ userId: 1, date: 1, healthDataHash: 1 }, { unique: true });

const HealthInsight: Model<IHealthInsight> = mongoose.models.HealthInsight || mongoose.model<IHealthInsight>('HealthInsight', HealthInsightSchema);

export default HealthInsight;
