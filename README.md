# Invoice Processor

A modern web application for processing and managing invoices using AI. Built with Next.js, MongoDB, and OpenAI.

## Features

- 📄 PDF Invoice Processing
- 🤖 AI-Powered Data Extraction
- 📊 Interactive Data Grid with Advanced Features:
  - Sorting and Filtering
  - Column Management
  - Data Export
  - Multi-select
  - Status Indicators
- 💾 MongoDB Database Integration
- 🎯 Real-time Data Updates
- 📱 Responsive Design
- 🔄 Modern Upload Interface

## Tech Stack

- **Frontend**: Next.js 15, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **AI Processing**: OpenAI GPT-3.5
- **PDF Processing**: pdf-parse-fork
- **Data Grid**: AG Grid Community
- **UI Components**: shadcn/ui
- **Form Handling**: react-dropzone
- **Notifications**: react-hot-toast

## Prerequisites

Before you begin, ensure you have:

- Node.js 18.x or higher
- npm or yarn
- MongoDB Atlas account
- OpenAI API key

## Getting Started

1. Clone the repository

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with:

```env
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
invoice-processor/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── components/     # React components
│   │   └── page.tsx        # Main page
│   ├── lib/                # Utility functions
│   └── models/             # MongoDB models
├── public/                 # Static files
└── ...config files
```

## Key Features Explained

### PDF Processing

- Upload PDF invoices through an intuitive drag-and-drop interface
- Automatic text extraction using pdf-parse-fork
- AI-powered data extraction using OpenAI's GPT-3.5

### Data Management

- Advanced data grid with enterprise-level features
- Real-time data updates
- Comprehensive filtering and sorting capabilities
- Column customization and management

### Data Visualization

- Status indicators for payment states
- Currency formatting
- Date formatting
- Responsive layout

## API Routes

- `POST /api/extract` - Process and extract data from PDF invoices
- `GET /api/invoices` - Retrieve all processed invoices

## Environment Variables

Required environment variables:

- `MONGODB_URI`: MongoDB connection string
- `OPENAI_API_KEY`: OpenAI API key

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [MongoDB](https://www.mongodb.com/)
- [OpenAI](https://openai.com/)
- [AG Grid](https://www.ag-grid.com/)
- [shadcn/ui](https://ui.shadcn.com/)
