import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  street: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  zip: { type: String, required: false },
  country: { type: String, required: false },
});

const LineItemSchema = new mongoose.Schema({
  description: { type: String, required: false },
  quantity: { type: Number, required: false },
  unitPrice: { type: Number, required: false },
  lineTotal: { type: Number, required: false },
});

const PaymentDetailsSchema = new mongoose.Schema({
  method: { type: String, required: false },
  status: {
    type: String,
    enum: ["Paid", "Unpaid", "Overdue", "Partial", null],
    required: false,
  },
  paymentDate: { type: Date, required: false },
  transactionReference: { type: String, required: false },
  balanceDue: { type: Number, required: false },
});

const InvoiceSchema = new mongoose.Schema({
  // Basic Invoice Details
  invoiceNumber: {
    type: String,
    required: false,
    index: false, // Explicitly disable indexing
  },
  invoiceDate: { type: Date, required: false },
  dueDate: { type: Date, required: false },
  paymentTerms: { type: String, required: false },

  // Client Information
  clientInfo: {
    name: { type: String, required: false },
    contactPerson: { type: String, required: false },
    address: { type: AddressSchema, required: false },
    email: { type: String, required: false },
    phone: { type: String, required: false },
  },

  // Business Information
  businessInfo: {
    name: { type: String, required: false },
    address: { type: AddressSchema, required: false },
    email: { type: String, required: false },
    phone: { type: String, required: false },
    taxId: { type: String, required: false },
  },

  // Line Items
  items: [LineItemSchema],

  // Summary Totals
  subtotal: { type: Number, required: false },
  discount: { type: Number, required: false },
  taxRate: { type: Number, required: false },
  taxAmount: { type: Number, required: false },
  totalAmount: { type: Number, required: false },

  // Payment Details
  paymentDetails: { type: PaymentDetailsSchema, required: false },

  // Metadata
  pdfUrl: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, required: false },
});

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema);
