import mongoose from "mongoose";

const LineItemSchema = new mongoose.Schema({
  itemCode: { type: String, required: false },
  description: { type: String, required: false },
  quantity: { type: Number, required: false },
  unit: { type: String, required: false },
  pricePerItem: { type: Number, required: false },
  grossTotal: { type: Number, required: false },
  vatAmount: { type: Number, required: false },
  netTotal: { type: Number, required: false },
});

const InvoiceSchema = new mongoose.Schema({
  // Invoice Level Information
  invoiceNumber: { type: String, required: false },
  companyFrom: { type: String, required: false },
  invoiceDate: { type: Date, required: false },
  grossTotal: { type: Number, required: false },
  vatTotal: { type: Number, required: false },
  netTotal: { type: Number, required: false },

  // Line Items
  items: [LineItemSchema],

  // Metadata
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, required: false },
  pdfUrl: { type: String, required: false },
});

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema);
