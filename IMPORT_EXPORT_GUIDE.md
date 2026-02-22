# 📦 Bulk Import/Export - Quick Start Guide

## Overview

Complete bulk import/export functionality for contacts with CSV file support, real-time progress tracking, column mapping, and advanced filtering options.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Run Database Migration
```bash
cd backend
npx prisma migrate dev --name add_import_export_features
npx prisma generate
```

### 3. Start Development Server
```bash
cd /home/engine/project
npm run dev
```

### 4. Access Import/Export
- Frontend: http://localhost:3000
- Navigate to: Dashboard → Customers
- Click: "Import/Export" button (in top right)

## 📋 CSV File Format

### Required Columns (Must Have)
1. **name** - Customer's full name
2. **phone** - Phone number with country code (+1 202 555 0123)

### Optional Columns (Nice to Have)
- **email** - Email address
- **company** - Company/organization name
- **source** - Lead source (website, referral, import, etc.)
- **gender** - Gender (male, female, other, prefer_not_to_say)
- **notes** - Additional notes
- **tags** - Comma-separated tag names (must already exist)
- **optIn** - Marketing opt-in status (true/false)
- **image** - Profile image URL

### Sample CSV File
```csv
name,phone,email,company,source,gender,notes,tags,optIn
John Doe,+1 202 555 0123,john@example.com,Acme Inc,website,male,VIP;Customer,true
Jane Smith,+1 555 0987,jane@company.com,Tech Corp,referral,female,Lead Contact,Important notes,true
```

### Download Sample CSV
You can download a sample CSV file from the Import/Export modal in the application.

## 🎯 How to Use

### Import Contacts

#### Step 1: Prepare CSV File
1. Create a CSV file with proper format
2. Include at least the required columns (name, phone)
3. Save file as UTF-8 encoded CSV
4. Ensure file size is under 10MB

#### Step 2: Upload CSV
1. Navigate to Dashboard → Customers
2. Click "Import/Export" button
3. Select "Import" tab
4. Review CSV format requirements
5. Download sample CSV if needed
6. Click "Choose CSV file" or drag and drop your file
7. Wait for upload to complete

#### Step 3: Map Columns (Optional)
1. The system will automatically map CSV columns
2. Required columns will be pre-mapped:
   - name → name
   - phone → phone
   - email → email
   - company → company
   - source → source
   - gender → gender
   - notes → notes
   - tags → tags
   - optIn → optIn
3. Review mappings and adjust if needed

#### Step 4: Import
1. Click "Import Customers" button
2. Wait for upload to complete
3. Watch the progress bar:
   - **0-30%**: Uploading and validating CSV
   - **30-90%**: Processing records (every 10%)
   - **100%**: Import completed successfully
4. Import happens in background (non-blocking)
5. You can continue using other features while importing

#### Step 5: View Progress
- Progress bar shows percentage complete
- Processed count vs Total records
- Status messages (uploading, processing, completed, failed)
- Error details if import fails

#### Step 6: Review Imported Contacts
1. Navigate back to Customers page
2. All imported contacts will appear in list
3. Search, filter, and manage as normal

### Export Contacts

#### Export All Contacts
1. Navigate to Dashboard → Customers
2. Click "Import/Export" button
3. Select "Export" tab
4. Leave all filters unchecked
5. Click "Export Customers to CSV" button
6. CSV file will download automatically
7. Filename: `customers_export_YYYY-MM-DDTHH:mm:ss.csv`

#### Export Filtered Contacts
1. Select specific customers in the table
2. Click "Import/Export" button
3. Select "Export" tab
4. Filter options:
   - **Opt-in Status**: Check "Opted In" or "Opted Out"
   - **Date Range**: Last 30 days, 90 days, or All Time
5. Click "Export Selected to CSV" button
6. Only selected customers will be exported

## 📊 CSV Export Format

Exported CSV files include all customer fields:

```csv
name,phone,email,company,source,gender,optIn,image,notes,tags,typeId,createdAt
John Doe,+1 202 555 0123,john@example.com,Acme Inc,website,male,true,"https://example.com/image.jpg",VIP notes;Customer,true,customer-type-1,2024-02-15T10:30:00.000Z
```

### Field Details
- **Quoted strings** - Text fields wrapped in quotes
- **Comma-separated** - Multiple values (tags, multiple tags)
- **ISO dates** - Timestamps in ISO 8601 format
- **Boolean values** - true/false for optIn
- **Proper escaping** - Quotes within strings escaped ("")

## ⚠️ Common Issues & Solutions

### Issue: "Only CSV files are allowed"
**Solution**: Ensure your file has `.csv` extension
- Open in Notepad: Save As → "CSV (Comma delimited)"
- Check file extension

### Issue: "Missing required columns: name, phone"
**Solution**: 
- Ensure first row contains headers: name,phone
- Column names are case-sensitive
- No extra spaces in column names

### Issue: "Duplicate records found"
**Explanation**: The system automatically detects and skips duplicates based on email and phone
**Solution**: 
- Duplicates are skipped (not inserted)
- No error is thrown
- Check import log for skipped records

### Issue: "Import failed - [column] tag must exist"
**Solution**: 
- Create tags in the Tags page first
- Use exact tag names in your CSV
- Comma-separate multiple tags: VIP,Customer,Lead

### Issue: Progress stuck at X%
**Solution**:
- Wait a moment (may be processing large batch)
- Check browser console for errors
- Refresh page and check import status
- Progress will auto-complete after 5 minutes

## 🔧 API Endpoints

### Import Endpoints
- `POST /api/customers/import` - Upload CSV file
- `GET /api/customers/import/progress/:id` - Get import progress

### Export Endpoints
- `GET /api/customers/export` - Export all customers
- `GET /api/customers/export?ids=...` - Export filtered customers
- `GET /api/customers/export?hasOptIn=true` - Export opted-in customers
- `GET /api/customers/export?dateRange=90d` - Export last 90 days
- `DELETE /api/customers/bulk` - Bulk delete customers

## 🎨 UI Features

### Import Tab
- ✅ CSV format information
- ✅ Download sample CSV
- ✅ Column mapping display
- ✅ File upload with drag-and-drop
- ✅ File size validation (max 10MB)
- ✅ Progress bar with percentage
- ✅ Status messages
- ✅ Error states
- ✅ Import button with loading state
- ✅ Reset functionality

### Export Tab
- ✅ Opt-in status filter
- ✅ Opt-out status filter
- ✅ Date range filter (30d, 90d, All Time)
- ✅ Selected customers export
- ✅ Export filters description
- ✅ Export button
- ✅ Clear filters button

### Progress Bar Component
- ✅ Visual progress indicator
- ✅ Color-coded states:
  - Default (blue) - Processing
  - Success (green) - Completed
  - Warning (yellow) - Partial
  - Danger (red) - Failed
- ✅ Smooth animations
- ✅ Percentage display
- ✅ Processed/Total count

## 📈 Performance

### Import Performance
- **Batch Size**: 100 records per batch
- **Progress Updates**: Every 10% (or every 10 records)
- **Timeout**: 5 minutes max for full import
- **Memory**: 10MB file limit
- **Duplicate Checking**: Fast Set lookup
- **Background Processing**: Non-blocking UI

### Export Performance
- **Streaming**: Direct download (no server storage needed)
- **Large Datasets**: Handles thousands of records
- **Optimized Queries**: Efficient database queries
- **Formatting**: Proper CSV escaping and quoting

## 🔒 Security

### File Upload Security
- ✅ File type validation (CSV only)
- ✅ File size limit (10MB max)
- ✅ Memory storage (no disk I/O)
- ✅ Proper cleanup after processing

### Data Validation
- ✅ Required field validation (name, phone)
- ✅ Email format validation
- ✅ Phone format validation
- ✅ Duplicate detection (email, phone)
- ✅ Tag existence validation
- ✅ Zod schema validation

### User Isolation
- ✅ All operations scoped to user's data
- ✅ Authentication required for all endpoints
- ✅ User can only see their own contacts
- ✅ CSV file stored temporarily in memory

## 📞 Support

### Import/Export Modal Location
- Dashboard → Customers → Click "Import/Export" button (top right)
- Modal opens with Import/Export tabs

### Keyboard Shortcuts
- Tab switching not available (must use mouse)
- Progress updates are automatic (no keyboard controls)

### Browser Compatibility
- ✅ Chrome - Full support
- ✅ Firefox - Full support
- ✅ Safari - Full support
- ✅ Edge - Full support
- ✅ Mobile browsers - Full support

## 📚 Documentation

### More Information
- **BULK_IMPORT_EXPORT.md** - Detailed feature documentation
- **IMPORT_EXPORT_COMPLETE.md** - Complete implementation summary
- **README.md** - Main project documentation
- **PROJECT_STRUCTURE.md** - Complete file structure

---

**Ready to import/export your contacts!** 📦

For questions or issues, refer to the detailed documentation files.
