import { NextResponse } from "next/server";
import PDFParser from "pdf-parse-fork";
import openai from "@/lib/openai";
import connectDB from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

export const maxDuration = 300;
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
  debug: (message: string, data?: any) => {
    console.log(
      `[DEBUG] ${message}`,
      data ? JSON.stringify(data, null, 2) : ""
    );
  },
};

// Helper functions for data cleaning
function cleanValue(value: any) {
  if (value === "") return null;
  if (value === "undefined") return null;
  if (value === "null") return null;
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

function validateAndCleanData(data: any) {
  const cleanData: any = {};

  Object.keys(data).forEach((key) => {
    if (key === "items" && Array.isArray(data[key])) {
      cleanData[key] = data[key].map((item: any) => ({
        description: cleanValue(item.description),
        quantity: parseNumber(item.quantity),
        unitPrice: parseNumber(item.unitPrice),
        lineTotal: parseNumber(item.lineTotal),
      }));
    } else if (key === "clientInfo" || key === "businessInfo") {
      cleanData[key] = {
        name: cleanValue(data[key]?.name),
        contactPerson: cleanValue(data[key]?.contactPerson),
        address: data[key]?.address
          ? {
              street: cleanValue(data[key].address.street),
              city: cleanValue(data[key].address.city),
              state: cleanValue(data[key].address.state),
              zip: cleanValue(data[key].address.zip),
              country: cleanValue(data[key].address.country),
            }
          : null,
        email: cleanValue(data[key]?.email),
        phone: cleanValue(data[key]?.phone),
      };
    } else if (key === "paymentDetails") {
      cleanData[key] = {
        method: cleanValue(data[key]?.method),
        status: cleanValue(data[key]?.status),
        paymentDate: parseDate(data[key]?.paymentDate),
        transactionReference: cleanValue(data[key]?.transactionReference),
        balanceDue: parseNumber(data[key]?.balanceDue),
      };
    } else if (typeof data[key] === "number") {
      cleanData[key] = parseNumber(data[key]);
    } else if (key === "invoiceDate" || key === "dueDate") {
      cleanData[key] = parseDate(data[key]);
    } else {
      cleanData[key] = cleanValue(data[key]);
    }
  });

  return cleanData;
}

const EXTRACTION_PROMPT = `Extract the following information from this invoice and return it as a JSON object with the exact structure shown below. Follow these specific formatting rules:

1. Dates should be in ISO format (YYYY-MM-DD)
2. All monetary values should be numbers with 2 decimal places (e.g., 1234.56)
3. Convert all currency values to numbers (remove currency symbols and formatting)
4. Numbers with thousand separators should be converted to plain numbers
5. Phone numbers should include country code if available
6. Return null for any fields where information is not found in the invoice

Expected JSON structure:
{
  "invoiceNumber": "string",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "paymentTerms": "string",
  
  "clientInfo": {
    "name": "string",
    "contactPerson": "string",
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zip": "string",
      "country": "string"
    },
    "email": "string",
    "phone": "string"
  },
  
  "businessInfo": {
    "name": "string",
    "address": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zip": "string",
      "country": "string"
    },
    "email": "string",
    "phone": "string",
    "taxId": "string"
  },
  
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "lineTotal": number
    }
  ],
  
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
    const file = formData.get("file");

    if (!file) {
      logger.error("No file uploaded", new Error("Missing file"));
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    logger.info("File received", { filename: (file as File).name });

    try {
      // Convert file to buffer
      const arrayBuffer = await (file as Blob).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      logger.info("File converted to buffer");

      // Extract text from PDF
      const pdfData = await PDFParser(buffer);
      logger.info("PDF text extracted", { textLength: pdfData.text.length });
      logger.debug("Extracted PDF text", {
        text: pdfData.text.substring(0, 500) + "...",
      });

      // Use OpenAI to extract information
      logger.info("Sending to OpenAI for extraction");
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: EXTRACTION_PROMPT,
          },
          {
            role: "user",
            content: pdfData.text,
          },
        ],
        model: "gpt-3.5-turbo",
      });

      logger.info("Received response from OpenAI");
      logger.debug("OpenAI response", {
        response: completion.choices[0].message.content,
      });

      // Parse the extracted data
      let extractedData;
      try {
        extractedData = JSON.parse(completion.choices[0].message.content);
        logger.info("Successfully parsed OpenAI response");
        logger.debug("Raw extracted data", { data: extractedData });
      } catch (error) {
        logger.error("Failed to parse OpenAI response", error);
        throw new Error("Invalid response format from OpenAI");
      }

      // Clean and validate the data
      const cleanedData = validateAndCleanData(extractedData);
      logger.debug("Cleaned data", { data: cleanedData });

      // Connect to MongoDB
      logger.info("Connecting to MongoDB");
      await connectDB();

      // Create and save invoice
      const invoice = new Invoice({
        ...cleanedData,
        pdfUrl: (file as File).name,
        lastUpdated: new Date(),
      });

      logger.info("Attempting to save invoice");
      const savedInvoice = await invoice.save();
      logger.info("Invoice saved successfully", {
        invoiceId: savedInvoice._id,
        invoiceNumber: savedInvoice.invoiceNumber,
      });

      return NextResponse.json(savedInvoice);
    } catch (error) {
      logger.error("Error in processing pipeline", error);
      throw error;
    }
  } catch (error) {
    logger.error("Fatal error in invoice processing", error);
    return NextResponse.json(
      {
        error: "Error processing invoice",
        details: (error as Error).message,
        stack:
          process.env.NODE_ENV === "development"
            ? (error as Error).stack
            : undefined,
      },
      { status: 500 }
    );
  }
}
