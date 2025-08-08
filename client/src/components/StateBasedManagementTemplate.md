# State-Based Management Template

This template provides a reusable component for creating state-based management pages similar to the Client Management page. It maintains all the original code, logic, and layout while making it configurable for different management contexts.

## Features

- **State-based navigation**: Left sidebar with states and districts
- **Dynamic filtering**: Search by multiple fields and status filters
- **Pagination**: Handles large datasets efficiently
- **Responsive design**: Works on all screen sizes
- **Customizable actions**: Configurable action buttons per item
- **Role-based access**: Permission control
- **Loading states**: Proper loading indicators
- **Empty states**: Customizable empty state messages

## Usage

### Basic Implementation

```tsx
import StateBasedManagementTemplate from "@/components/StateBasedManagementTemplate";

export default function MyManagement() {
  const config = {
    title: "My Management Page",
    backUrl: "/admin",
    totalListLabel: "Total Items",
    totalListBadgeColor: "bg-blue-500 hover:bg-blue-600",
    fetchUrl: "/api/my-items",
    
    // Required functions
    itemDisplayName: (item) => `${item.firstName} ${item.lastName}`,
    getItemCountForState: (state, items) => items.filter(i => i.state === state).length,
    getItemCountForDistrict: (district, items) => items.filter(i => i.district === district).length,
    
    // Search configuration
    searchPlaceholder: "Search items...",
    searchFilters: [
      { value: "all", label: "All Fields" },
      { value: "name", label: "Name" }
    ],
    statusFilters: [
      { value: "all", label: "All Status" },
      { value: "active", label: "Active" }
    ],
    
    // Table configuration
    tableColumns: [
      {
        key: "name",
        label: "Name",
        render: (item) => <span>{item.name}</span>
      }
    ],
    
    // Permissions
    requiredRoles: ["admin", "super_admin"]
  };

  return <StateBasedManagementTemplate config={config} />;
}
```

## Configuration Options

### Page Configuration
- `title`: Page title displayed in header
- `backUrl`: URL to navigate back to (e.g., "/admin")
- `totalListLabel`: Label for the total items button (e.g., "Total Client List")
- `totalListBadgeColor`: CSS classes for the total list badge color

### API Configuration
- `fetchUrl`: API endpoint to fetch data from
- `itemRole`: Optional role filter to apply to fetched data

### Display Configuration
- `itemDisplayName`: Function that returns display name for an item
- `itemDescription`: Optional function that returns description for an item
- `getItemCountForState`: Function that returns count of items for a state
- `getItemCountForDistrict`: Function that returns count of items for a district

### Search Configuration
- `searchPlaceholder`: Placeholder text for search input
- `searchFilters`: Array of search filter options
- `statusFilters`: Array of status filter options

### Table Configuration
- `tableColumns`: Array of column definitions with `key`, `label`, and `render` function

### Actions Configuration
- `actions`: Optional array of action buttons for each item
  - `label`: Action button label
  - `icon`: React icon component
  - `onClick`: Function to handle action click
  - `variant`: Button variant (optional)
  - `color`: Color class (optional)
  - `tooltip`: Tooltip text (optional)

### Permissions
- `requiredRoles`: Array of roles that can access this page

### Styling Options
- `stateItemBadgeColor`: CSS classes for state item badges
- `loadingText`: Custom loading message
- `emptyStateText`: Custom empty state message
- `emptyStateIcon`: Custom empty state icon

## Advanced Examples

### Worker Management

```tsx
const config = {
  title: "Worker Management",
  backUrl: "/admin",
  totalListLabel: "Total Worker List",
  totalListBadgeColor: "bg-green-500 hover:bg-green-600",
  fetchUrl: "/api/admin/users",
  itemRole: "worker",
  
  itemDisplayName: (worker) => `${worker.firstName} ${worker.lastName}`,
  getItemCountForState: (state, workers) => 
    workers.filter(w => w.state === state && w.role === "worker").length,
  getItemCountForDistrict: (district, workers) => 
    workers.filter(w => w.district === district && w.role === "worker").length,
  
  tableColumns: [
    {
      key: "worker",
      label: "Worker",
      render: (worker) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={worker.profilePicture} />
            <AvatarFallback>{worker.firstName?.[0]}{worker.lastName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{worker.firstName} {worker.lastName}</div>
            <div className="text-sm text-gray-500">ID: {worker.id}</div>
          </div>
        </div>
      )
    }
  ],
  
  actions: [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: handleViewDetails
    },
    {
      label: "Verify",
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: handleVerifyWorker,
      color: "green"
    }
  ],
  
  requiredRoles: ["admin", "super_admin"]
};
```

### Booking Management

```tsx
const config = {
  title: "Booking Management",
  backUrl: "/admin",
  totalListLabel: "Total Booking List",
  totalListBadgeColor: "bg-indigo-500 hover:bg-indigo-600",
  fetchUrl: "/api/admin/bookings",
  
  itemDisplayName: (booking) => `Booking #${booking.id.slice(0, 8)}`,
  getItemCountForState: (state, bookings) => 
    bookings.filter(b => b.state === state).length,
  getItemCountForDistrict: (district, bookings) => 
    bookings.filter(b => b.district === district).length,
  
  searchFilters: [
    { value: "all", label: "All Fields" },
    { value: "id", label: "Booking ID" },
    { value: "client", label: "Client" },
    { value: "worker", label: "Worker" },
    { value: "service", label: "Service" }
  ],
  
  statusFilters: [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" }
  ],
  
  tableColumns: [
    {
      key: "booking",
      label: "Booking Details",
      render: (booking) => (
        <div>
          <div className="font-medium">#{booking.id.slice(0, 8)}</div>
          <div className="text-sm text-gray-500">{booking.serviceCategory}</div>
        </div>
      )
    },
    {
      key: "status",
      label: "Status",
      render: (booking) => (
        <Badge variant="secondary">
          {booking.status}
        </Badge>
      )
    }
  ],
  
  requiredRoles: ["admin", "super_admin"]
};
```

## Data Structure Requirements

Your API endpoint should return an array of objects with these minimum fields:

```typescript
interface BaseItem {
  id: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  district?: string;
  state?: string;
  // ... other fields specific to your use case
}
```

## Built-in Features

### Search Functionality
- Supports multiple search filters
- Real-time filtering as you type
- Handles both text and dropdown filters

### Status Filtering
- Multiple status options
- Can filter by activity status (active, inactive, etc.)
- Can filter by verification status

### Pagination
- Automatic pagination for large datasets
- Separate pagination for total view and district view
- Configurable page size (default: 10 items)

### Navigation
- Three-level navigation: States → Districts → Items
- Breadcrumb-style back navigation
- Loading states during navigation

### Responsive Design
- Collapsible sidebar for mobile
- Responsive table layout
- Touch-friendly interface

## Tips for Implementation

1. **Start Simple**: Begin with basic configuration and add features incrementally
2. **Reuse Components**: Leverage existing UI components for consistency
3. **Handle Empty States**: Provide meaningful messages when no data is available
4. **Add Loading States**: Use the built-in loading indicators
5. **Test Permissions**: Ensure role-based access works correctly
6. **Customize Styling**: Use the styling options to match your design system

## Related Files

- `StateBasedManagementTemplate.tsx`: Main template component
- `WorkerManagement.tsx`: Example worker management implementation
- `AdminManagement.tsx`: Example admin management implementation  
- `BookingManagement.tsx`: Example booking management implementation
- `ClientManagement.tsx`: Original client management page (reference)

## Best Practices

1. **Consistent Naming**: Use consistent naming conventions for actions and labels
2. **Error Handling**: Implement proper error handling in action functions
3. **Performance**: Use React.memo() for heavy render functions if needed
4. **Accessibility**: Ensure proper ARIA labels and keyboard navigation
5. **Testing**: Test with different data sizes and edge cases