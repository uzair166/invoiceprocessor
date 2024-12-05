import { NextResponse } from "next/server";
import PDFParser from "pdf-parse-fork";
import openai from "@/lib/openai";
import connectDB from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Custom logger for detailed process tracking
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : "");
  },
  error: (message: string, error: any) => {
    console.error(`[ERROR] ${message}`, error);
    if (error.stack) console.error(error.stack);
  },
};

// Helper functions for data cleaning
function cleanValue(value: any) {
  if (value === "" || value === "undefined" || value === "null") return null;
  return value;
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    return cleaned ? parseFloat(cleaned) : null;
  }
  return null;
}

function parseDate(value: any): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

// Optimized prompt for faster processing
const EXTRACTION_PROMPT = `Extract invoice data as JSON. Format: dates as YYYY-MM-DD, monetary values as numbers (1234.56), remove currency symbols, convert thousand separators. Return null for missing fields.

{
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "paymentTerms": "string",
  "clientInfo": {
    "name": "string",
    "contactPerson": "string",
    "address": {"street": "string", "city": "string", "state": "string", "zip": "string", "country": "string"},
    "email": "string",
    "phone": "string"
  },
  "businessInfo": {
    "name": "string",
    "address": {"street": "string", "city": "string", "state": "string", "zip": "string", "country": "string"},
    "email": "string",
    "phone": "string",
    "taxId": "string"
  },
  "items": [{"description": "string", "quantity": number, "unitPrice": number, "lineTotal": number}],
  "subtotal": number,
  "discount": number,
  "taxRate": number,
  "taxAmount": number,
  "totalAmount": number,
  "paymentDetails": {
    "method": "string",
    "status": "Paid|Unpaid|Overdue|Partial",
    "paymentDate": "YYYY-MM-DD",
    "transactionReference": "string",
    "balanceDue": number
  }
}`;

export async function POST(req: Request) {
  try {
    logger.info("Starting invoice processing");

    // Get file from request
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Early validation of file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF file." },
        { status: 400 }
      );
    }

    // Early validation of file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    logger.info("File validation passed", {
      filename: file.name,
      size: file.size,
    });

    try {
      // Convert file to buffer and extract text
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const pdfData = await PDFParser(buffer);

      if (!pdfData.text || pdfData.text.length < 10) {
        return NextResponse.json(
          {
            error:
              "Could not extract text from PDF. Please ensure the PDF contains readable text.",
          },
          { status: 400 }
        );
      }

      // Use OpenAI to extract information with optimized model
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: pdfData.text },
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.1, // Lower temperature for more focused responses
        response_format: { type: "json_object" }, // Enforce JSON response
      });

      // Parse and validate the extracted data
      const extractedData = JSON.parse(completion.choices[0].message.content);

      // Connect to MongoDB and save
      await connectDB();
      const invoice = new Invoice({
        ...extractedData,
        pdfUrl: file.name,
        lastUpdated: new Date(),
      });

      const savedInvoice = await invoice.save();

      return NextResponse.json({
        success: true,
        message: "Invoice processed successfully",
        invoice: savedInvoice,
      });
    } catch (error: any) {
      logger.error("Processing error", error);
      return NextResponse.json(
        {
          error: "Error processing invoice",
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error("Fatal error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
