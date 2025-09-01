# Synergetics - Integrated Business Management Platform

A comprehensive business management solution built with React, TypeScript, and Supabase. Streamline your business operations with integrated financial management, sales, purchases, inventory, and reporting capabilities.

## 🚀 Features

### Multi-Role Access
- **Admin Panel**: Global company management, user administration, and oversight
- **Manager Panel**: Day-to-day operations, financial management, and team coordination
- **User Portal**: Business proposal submission and assignment waiting area

### Financial Management
- Chart of Accounts
- Journal Entries
- Trial Balance
- Profit & Loss Statements
- Balance Sheet
- Cash & Bank Management

### Sales & Customer Management
- Sales Invoices
- Customer Estimates/Quotations
- Customer Database
- Customer Transaction History
- Payment Tracking

### Purchase & Supplier Management
- Purchase Orders
- Purchase Bills
- Supplier Database
- Supplier Transaction History
- Payment Processing

### Inventory & Operations
- Product & Service Management
- Inventory Tracking
- Product Transaction History
- Operations Dashboard

### Performance & Reporting
- Sales Targets & Goals
- Performance Tracking
- Comprehensive Financial Reports
- Business Analytics

### User Management
- Role-based Access Control (Admin/Manager/User)
- KYC Verification Process
- Business Proposal Submission
- User Assignment Management

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS with custom components
- **State Management**: React Query, Zustand
- **Backend**: Supabase (Authentication, Database, Real-time)
- **Routing**: React Router v6
- **Validation**: Zod
- **UI Components**: Radix UI, Lucide React Icons
- **PDF Generation**: jsPDF, html2canvas
- **Date Handling**: date-fns
- **Charts**: Recharts

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── integrations/       # Third-party service integrations
├── lib/                # Utility functions and helpers
├── pages/              # Page components organized by role
├── services/           # Business logic and API services
├── types/              # TypeScript interfaces and types
└── utils/              # Helper functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ or Bun
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd poysa-vite

# Install dependencies
npm install
# or
bun install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
# Start development server
npm run dev
# or
bun run dev
```

### Build

```bash
# Build for production
npm run build
# or
bun run build
```

### Preview

```bash
# Preview production build
npm run preview
# or
bun run preview
```

## 🎨 Key Components

### Authentication Flow
- Role-based routing and access control
- KYC verification process for managers
- Business proposal submission for users
- Assignment waiting area

### Responsive Design
- Collapsible sidebars for optimal screen usage
- Mobile-friendly interface
- Dark mode support

### Data Management
- Real-time data synchronization
- Comprehensive form validation
- File upload capabilities
- PDF generation for reports

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 User Roles

### Admin
- Company management
- User administration
- KYC verification
- Business proposal review
- Global financial oversight

### Manager
- Daily operations management
- Financial transactions
- Customer and supplier management
- Inventory control
- Performance tracking

### User
- Business proposal submission
- Assignment waiting area
- Basic dashboard access

## 📊 Reporting Features

- **Financial Dashboard**: Real-time financial overview
- **Trial Balance**: Account reconciliation
- **Profit & Loss**: Revenue and expense analysis
- **Balance Sheet**: Asset and liability tracking
- **Performance Reports**: Target achievement tracking

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 📞 Support

For support, please contact the development team or refer to the internal documentation.

## 🙏 Acknowledgments

- Built with React and TypeScript
- Powered by Supabase
- UI components from Radix UI and Tailwind CSS
- Icons from Lucide React
- Charts powered by Recharts

---

*Synergetics - Streamline your business processes with our integrated management platform*
