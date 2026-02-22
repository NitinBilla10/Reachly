# CRM Extensions - Contact Management Features

## Overview

Extended the Reachly WhatsApp CRM platform with comprehensive contact management capabilities including new fields, contact types, filtering, and enhanced UI.

## New Features Added

### 1. Enhanced Contact Fields

#### New Contact Fields
- **gender** - Customer gender (male, female, other, prefer_not_to_say)
- **company** - Company/organization name
- **source** - Lead source (website, referral, import, etc.)
- **optIn** - Marketing opt-in status (boolean)
- **image** - Profile image URL
- **typeId** - Foreign key to ContactType

#### Updated Customer Model
```prisma
model Customer {
  id        String   @id @default(cuid())
  userId    String
  name      String
  phone     String   @unique
  email     String?
  notes     String?
  gender    String?  // NEW
  company   String?  // NEW
  source    String?  // NEW
  optIn     Boolean  @default(true)  // NEW
  image     String?  // NEW
  typeId    String?  // NEW
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  type            ContactType?       @relation(fields: [typeId], references: [id], onDelete: SetNull)  // NEW
  tags            CustomerTag[]
  campaignMessages CampaignMessage[]
  messages        Message[]
  conversations   Conversation[]
  
  @@map("customers")
}
```

### 2. Contact Types Management

#### New ContactType Model
```prisma
model ContactType {
  id          String   @id @default(cuid())
  userId      String
  name        String
  color       String   @default("#6B7280")
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  customers  Customer[]
  
  @@unique([userId, name])
  @@map("contact_types")
}
```

#### ContactType Features
- Create custom contact categories (VIP, Lead, Customer, Prospect, etc.)
- Color-coded contact types
- Description for each type
- Cascade delete (removes typeId from customers when type is deleted)
- Count of customers per contact type

### 3. Enhanced Filtering

#### New Filter Options
- **By Contact Type** - Filter customers by their type
- **By Opt-in Status** - Filter by opted-in/opted-out customers
- **By Tags** - Existing tag filtering (multi-select)
- **Search** - Enhanced search includes company name

#### Filter Combinations
Users can combine multiple filters:
- Filter by type + tags
- Filter by opt-in status + tags
- Filter by type + opt-in status
- Search with any combination of filters

### 4. API Endpoints

#### Contact Types CRUD (5 endpoints)
- `GET /contact-types` - Get all contact types
- `GET /contact-types/:id` - Get contact type by ID with customers count
- `POST /contact-types` - Create new contact type
- `PUT /contact-types/:id` - Update contact type
- `DELETE /contact-types/:id` - Delete contact type (cascade)

#### Enhanced Customers CRUD
- `GET /customers` - Now supports:
  - `typeId` - Filter by contact type
  - `source` - Filter by source
  - `optIn` - Filter by opt-in status
- `POST /customers` - Create with all new fields
- `PUT /customers/:id` - Update with all new fields
- `DELETE /customers/:id` - Delete customer

### 5. Frontend Components

#### New Pages
1. **Contact Types Page** (`/dashboard/contact-types`)
   - Grid view of all contact types
   - Color-coded display
   - Customer count per type
   - Create/Edit/Delete dialogs
   - Search functionality

2. **Enhanced Customers Page** (`/dashboard/customers`)
   - Enhanced form with all new fields
   - Avatar display (with image support)
   - Gender dropdown
   - Company field
   - Source badges
   - Opt-in toggle with status indicator
   - Contact type selector
   - Profile image upload (URL input with preview)
   - Multi-field table view

#### Enhanced Components
- **Avatar with Image Support** - Display customer profile images
- **Gender Select** - Dropdown for gender selection
- **Opt-in Toggle** - Switch for opt-in status
- **Contact Type Select** - Filter dropdown
- **Company Display** - Company name with icon
- **Source Badges** - Visual source indicators

### 6. Validation Schemas

#### New Validation Schemas
```typescript
export const createContactTypeSchema = z.object({
  name: z.string().min(1, 'Contact type name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  description: z.string().optional()
})

export const updateContactTypeSchema = z.object({
  name: z.string().min(1, 'Contact type name is required').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  description: z.string().optional()
})
```

#### Enhanced Customer Validation
```typescript
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),  // NEW
  company: z.string().optional(),  // NEW
  source: z.string().optional(),  // NEW
  optIn: z.boolean().default(true),  // NEW
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),  // NEW
  typeId: z.string().optional()  // NEW
})
```

### 7. API Client Updates

#### New Contact Types API
```typescript
export const contactTypesAPI = {
  getAll: () => api.get('/contact-types'),
  getById: (id: string) => api.get(`/contact-types/${id}`),
  create: (data: { name, color?, description? }) => api.post('/contact-types', data),
  update: (id, data) => api.put(`/contact-types/${id}`, data),
  delete: (id: string) => api.delete(`/contact-types/${id}`),
}
```

#### Enhanced Customers API
```typescript
export const customersAPI = {
  getAll: (params?: {
    page?: number
    limit?: number
    search?: string
    tagIds?: string[]
    typeId?: string  // NEW
    source?: string  // NEW
    optIn?: boolean  // NEW
  }) => api.get('/customers', { params }),
  
  create: (data: {
    name, phone, email?, notes?, tags?,
    gender?,  // NEW
    company?,  // NEW
    source?,  // NEW
    optIn?,  // NEW
    image?,  // NEW
    typeId?  // NEW
  }) => api.post('/customers', data),
  
  update: (id, data) => api.put(`/customers/${id}`, data),
  
  delete: (id: string) => api.delete(`/customers/${id}`),
}
```

## User Experience Improvements

### 1. Visual Enhancements
- **Customer Avatars** - Display profile images or initials
- **Color Coding** - Contact types with distinctive colors
- **Status Indicators** - Opt-in status with icons
- **Company Icons** - Building2 icon for company field
- **Source Badges** - Visual source categorization

### 2. Form Enhancements
- **Field Grouping** - Related fields grouped together
- **Real-time Preview** - Profile image preview
- **Validation Feedback** - Inline validation messages
- **Multi-column Layout** - Efficient use of screen space
- **Responsive Design** - Mobile-friendly forms

### 3. Filtering Enhancements
- **Active Filter Indicators** - Clear visual feedback on active filters
- **Clear Filters Button** - One-click reset of all filters
- **Combination Support** - Multiple filters work together
- **Performance Optimization** - Debounced search input

### 4. Navigation Updates
- **New Sidebar Item** - "Contact Types" added to navigation menu
- **Logical Grouping** - Related items grouped together
- **Active State** - Visual indication of current page

## Database Changes

### Migration Required
After updating the Prisma schema, run:

```bash
cd backend
npx prisma migrate dev --name add_crm_contact_fields
```

This migration will:
1. Add new columns to the customers table
2. Create the contact_types table
3. Create foreign key relationships
4. Add cascade delete rules

## File Changes Summary

### Backend Files (4 files)
1. **backend/prisma/schema.prisma**
   - Added ContactType model
   - Updated Customer model with 6 new fields
   - Added type relationship to Customer
   - Added contactTypes relationship to User

2. **backend/src/validation/common.ts**
   - Added createContactTypeSchema
   - Added updateContactTypeSchema
   - Updated createCustomerSchema with new fields
   - Updated updateCustomerSchema with new fields
   - Added TypeScript exports

3. **backend/src/routes/contactTypes.ts** (NEW FILE)
   - 5 API endpoints for CRUD operations
   - Include customer counts
   - Cascade delete logic

4. **backend/src/server.ts**
   - Added contactTypeRoutes import
   - Mounted /contact-types route with authentication

### Frontend Files (3 files)
1. **frontend/src/app/dashboard/contact-types/page.tsx** (NEW FILE)
   - Complete Contact Types management page
   - Grid layout with color cards
   - Create/Edit/Delete dialogs
   - Customer counts display
   - Search functionality

2. **frontend/src/app/dashboard/customers/page.tsx** (COMPLETE REWRITE)
   - Enhanced form with all new fields
   - Advanced filtering (type, opt-in, source)
   - Avatar support with images
   - Gender selection
   - Opt-in status indicators
   - Company and source display
   - Improved table layout

3. **frontend/src/lib/api.ts**
   - Added contactTypesAPI with 5 methods
   - Enhanced customersAPI with new parameters
   - Added TypeScript type definitions

4. **frontend/src/components/layout/sidebar.tsx**
   - Added "Contact Types" to navigation menu
   - User icon for Contact Types link

## Features Implemented

### ✅ Contacts CRUD
- Create customers with all new fields
- Read customers with filtering
- Update customer details
- Delete customers with confirmation
- Search across multiple fields

### ✅ Tags CRUD
- Create tags
- Read all tags
- Update tags
- Delete tags
- Multi-tag assignment to customers

### ✅ Contact Types CRUD
- Create contact types
- Read all contact types
- Update contact types
- Delete contact types (cascade)
- View customer count per type

### ✅ Assign Tags
- Multi-select tags in customer form
- Visual tag selection
- Color-coded tag badges
- Tag filtering in customer list

### ✅ Filters
- Search by name, phone, email, company
- Filter by contact type
- Filter by opt-in status
- Filter by tags (multi-select)
- Clear all filters button

### ✅ Cascade Delete
- Deleting contact type sets typeId to null for customers
- Deleting customer removes all related records
- Foreign key cascade properly configured

## Use Cases

### 1. Lead Management
- Create "Lead" contact type with yellow color
- Import leads from CSV with source tracking
- Filter by source to see conversion rates
- Track opt-in status for compliance

### 2. Customer Segmentation
- Create types: VIP, Regular, Prospect, Churned
- Color-code each segment
- Filter campaigns by customer type
- Report on segment sizes

### 3. Compliance Tracking
- Opt-in field for marketing consent
- Filter by opt-in status
- Source tracking for regulatory compliance
- Easy identification of opted-out contacts

### 4. Personalization
- Profile images for recognition
- Gender for personalized messaging
- Company context for B2B communications
- Source awareness for follow-up relevance

## Technical Details

### Prisma Relationship Configuration
- **onDelete: SetNull** for Customer.typeId (soft delete)
- **onDelete: Cascade** for all user relationships
- **@@unique** constraint for contact types per user
- Foreign key constraints properly configured

### TypeScript Type Safety
- All new fields properly typed
- API request/response interfaces
- Zod validation schemas
- Enum types for gender fields

### Performance Considerations
- Debounced search input (300ms)
- Optimized database queries with selects
- Pagination support for large datasets
- Efficient filtering at database level

## Future Enhancements (Optional)

1. **Import/Export** - CSV import/export for bulk operations
2. **Bulk Actions** - Delete multiple customers at once
3. **Advanced Filters** - Date ranges, activity filters
4. **Contact Deduplication** - Detect and merge duplicates
5. **Contact History** - Track changes to customer records
6. **Custom Fields** - User-defined custom contact attributes

## Testing Checklist

- [ ] Create contact type works
- [ ] Update contact type works
- [ ] Delete contact type cascades to customers
- [ ] Create customer with all fields works
- [ ] Update customer with new fields works
- [ ] Customer filtering works correctly
- [ ] Contact type filtering works
- [ ] Opt-in filtering works
- [ ] Tag assignment works
- [ ] Profile images display correctly
- [ ] Avatar fallback to initials
- [ ] Gender selection persists
- [ ] Company field saves correctly
- [ ] Source badge displays properly

## Notes

- All new fields are optional except name and phone
- Opt-in defaults to true for new customers
- Image field stores URL, not binary data
- Contact types can be deleted even if in use (sets typeId to null)
- Gender is stored as string, not enum (flexible for future values)
- Source tracking is free-form text for flexibility
- Form validation ensures data integrity before API calls

---

This extension provides a comprehensive CRM contact management system that integrates seamlessly with the existing WhatsApp messaging capabilities.
