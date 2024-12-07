import { NextResponse } from "next/server";
import PDFParser from "pdf-parse-fork";
import openai from "@/lib/openai";
import connectDB from "@/lib/mongodb";
import Invoice from "@/models/Invoice";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

// Optimized prompt for faster processing
const EXTRACTION_PROMPT = `Extract data for ALL invoices in the PDF as JSON. Each invoice should have these fields:

1. Invoice level:
   - Invoice number (e.g., "3620/00104227" or "E17/IN525138")
   - Company the invoice is from (e.g., "Jewson" or "C&S Builders Merchants")
   - Invoice date (format: YYYY-MM-DD)
   - Gross total (before VAT)
   - VAT amount
   - Net total (after VAT)

2. For each item in each invoice:
   - Item code/SKU (e.g., "AGSTB005" or "969696905865")
   - Description (e.g., "JEWSON Sharp Concreting Sand")
   - Quantity (as number)
   - Unit (e.g., "EA" or "BAG")
   - Price per item (as number)
   - Gross total for item
   - VAT amount for item
   - Net total for item

Return as JSON array of invoices:
{
  "invoices": [
    {
      "invoiceNumber": "string",
      "companyFrom": "string",
      "invoiceDate": "YYYY-MM-DD",
      "grossTotal": number,
      "vatTotal": number,
      "netTotal": number,
      "items": [
        {
          "itemCode": "string",
          "description": "string",
          "quantity": number,
          "unit": "string",
          "pricePerItem": number,
          "grossTotal": number,
          "vatAmount": number,
          "netTotal": number
        }
      ]
    }
  ]
}`;

export async function POST(req: Request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    // Get file from request
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400, headers }
      );
    }

    // Early validation of file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF file." },
        { status: 400, headers }
      );
    }

    // Early validation of file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400, headers }
      );
    }

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
          { status: 400, headers }
        );
      }

      // Use OpenAI to extract information with optimized model
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: EXTRACTION_PROMPT },
          { role: "user", content: pdfData.text },
        ],
        model: "gpt-3.5-turbo-1106",
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      if (!completion.choices[0].message.content) {
        throw new Error("Failed to get content from OpenAI response");
      }

      // Parse and validate the extracted data
      const extractedData = JSON.parse(completion.choices[0].message.content);

      if (!extractedData.invoices || !Array.isArray(extractedData.invoices)) {
        throw new Error("Invalid response format from OpenAI");
      }

      // Connect to MongoDB
      await connectDB();

      // Save all invoices
      const savedInvoices = await Promise.all(
        extractedData.invoices.map(async (invoiceData) => {
          const invoice = new Invoice({
            ...invoiceData,
            pdfUrl: file.name,
            lastUpdated: new Date(),
          });
          return await invoice.save();
        })
      );

      return NextResponse.json(
        {
          success: true,
          message: `Successfully processed ${savedInvoices.length} invoice(s)`,
          invoices: savedInvoices,
        },
        { headers }
      );
    } catch (error: any) {
      console.error("Processing error:", error);
      return NextResponse.json(
        {
          error: "Error processing invoice(s)",
          details: error.message,
        },
        { status: 500, headers }
      );
    }
  } catch (error: any) {
    console.error("Fatal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers }
    );
  }
}
