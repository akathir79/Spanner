# StateBasedManagementTemplate Component

A reusable template component based on the Client Management page structure for Tamil Nadu District-Wise Blue Collar Service Marketplace. This template preserves all code, logic, and layout while removing database-specific details, making it configurable for different management contexts.

## Features

- **State-based navigation**: Hierarchical navigation through states → districts → items
- **Full search and filtering**: Configurable search fields and status filters
- **Pagination**: Built-in pagination for large datasets
- **Responsive design**: Mobile-friendly layout with collapsible sidebar
- **Action system**: Configurable dropdown actions for each item
- **Consistent styling**: Matches the original Client Management design
- **TypeScript support**: Fully typed configuration interface

## Usage

### Basic Implementation

```tsx
import StateBasedManagementTemplate from "@/components/StateBasedManagementTemplate";
import { ManagementConfig } from "@/components/StateBasedManagementTemplate";

const config: ManagementConfig = {
  // Configuration object
};

export default function MyManagement() {
  return <StateBasedManagementTemplate config={config} />;
}
```

## Configuration Options

### Page Configuration
```tsx
{
  title: "Worker Management",              // Page title
  backUrl: "/admin",                       // Back button navigation
  totalListLabel: "Total Worker List",     // Label for the total items button
  totalListBadgeColor: "bg-green-500",     // Badge color for total count
}
```

### API Configuration
```tsx
{
  fetchUrl: "/api/admin/users",             // API endpoint to fetch data
  itemRole: "worker",                       // Filter by role (optional)
}
```

### Display Configuration
```tsx
{
  itemDisplayName: (item) => `${item.firstName} ${item.lastName}`,
  itemDescription: (item) => item.email || "No email provided",
  getItemCountForState: (state, items) => 
    items.filter(i => i.state === state && i.role === "worker").length,
  getItemCountForDistrict: (district, items) => 
    items.filter(i => i.district === district && i.role === "worker").length,
}
```

### Search Configuration
```tsx
{
  searchPlaceholder: "Search workers...",
  searchFilters: [
    { value: "all", label: "All Fields" },
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    // ... more filters
  ],
  statusFilters: [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    // ... more status filters
  ],
}
```

### Table Configuration
```tsx
{
  tableColumns: [
    {
      key: "worker",
      label: "Worker",
      render: (worker) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{worker.firstName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{worker.firstName} {worker.lastName}</div>
            <div className="text-sm text-gray-500">ID: {worker.id}</div>
          </div>
        </div>
      )
    },
    // ... more columns
  ],
}
```

### Actions Configuration
```tsx
{
  actions: [
    {
      label: "View Details",
      icon: <Eye className="w-4 h-4" />,
      onClick: (item) => console.log("View", item),
      tooltip: "View worker details"
    },
    {
      label: "Delete",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (item) => console.log("Delete", item),
      color: "red",
      tooltip: "Delete worker"
    },
    // ... more actions
  ],
}
```

### Permissions & Styling
```tsx
{
  requiredRoles: ["admin", "super_admin"],  // Required user roles
  stateItemBadgeColor: "bg-green-500",      // State list badge color
  loadingText: "Loading worker data...",     // Loading message
  emptyStateText: "No workers found",       // Empty state message
  emptyStateIcon: <Users className="w-8 h-8 text-gray-400" />
}
```

## Complete Examples

### 1. Worker Management
```tsx
// client/src/pages/WorkerManagement.tsx
import StateBasedManagementTemplate from "@/components/StateBasedManagementTemplate";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Edit, Trash2, Users } from "lucide-react";

export default function WorkerManagement() {
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
    
    searchPlaceholder: "Search workers...",
    searchFilters: [
      { value: "all", label: "All Fields" },
      { value: "name", label: "Name" },
      { value: "email", label: "Email" },
    ],
    statusFilters: [
      { value: "all", label: "All Status" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
    
    tableColumns: [
      {
        key: "worker",
        label: "Worker",
        render: (worker) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-green-100 text-green-700">
                {worker.firstName?.[0]}{worker.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{worker.firstName} {worker.lastName}</div>
              <div className="text-sm text-gray-500">ID: {worker.id}</div>
            </div>
          </div>
        )
      },
      // ... more columns
    ],
    
    actions: [
      {
        label: "View Details",
        icon: <Eye className="w-4 h-4" />,
        onClick: (worker) => console.log("View worker:", worker),
      },
      {
        label: "Edit",
        icon: <Edit className="w-4 h-4" />,
        onClick: (worker) => console.log("Edit worker:", worker),
        color: "blue",
      },
      {
        label: "Delete",
        icon: <Trash2 className="w-4 h-4" />,
        onClick: (worker) => console.log("Delete worker:", worker),
        color: "red",
      },
    ],
    
    requiredRoles: ["admin", "super_admin"],
    stateItemBadgeColor: "bg-green-500",
    loadingText: "Loading worker data...",
    emptyStateText: "No workers found",
    emptyStateIcon: <Users className="w-8 h-8 text-gray-400" />
  };

  return <StateBasedManagementTemplate config={config} />;
}
```

### 2. Booking Management
```tsx
// client/src/pages/BookingManagement.tsx
import StateBasedManagementTemplate from "@/components/StateBasedManagementTemplate";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, Edit, XCircle } from "lucide-react";

export default function BookingManagement() {
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
    
    searchPlaceholder: "Search bookings...",
    searchFilters: [
      { value: "all", label: "All Fields" },
      { value: "id", label: "Booking ID" },
      { value: "client", label: "Client" },
      { value: "worker", label: "Worker" },
    ],
    statusFilters: [
      { value: "all", label: "All Status" },
      { value: "pending", label: "Pending" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
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
          <Badge variant={booking.status === "completed" ? "default" : "secondary"}>
            {booking.status}
          </Badge>
        )
      },
      // ... more columns
    ],
    
    actions: [
      {
        label: "View Details",
        icon: <Eye className="w-4 h-4" />,
        onClick: (booking) => console.log("View booking:", booking),
      },
      {
        label: "Cancel",
        icon: <XCircle className="w-4 h-4" />,
        onClick: (booking) => console.log("Cancel booking:", booking),
        color: "red",
      },
    ],
    
    requiredRoles: ["admin", "super_admin"],
    stateItemBadgeColor: "bg-indigo-500",
    loadingText: "Loading booking data...",
    emptyStateText: "No bookings found",
    emptyStateIcon: <Calendar className="w-8 h-8 text-gray-400" />
  };

  return <StateBasedManagementTemplate config={config} />;
}
```

## Navigation Integration

To integrate with dashboard cards:

### 1. Add Routes to App.tsx
```tsx
import WorkerManagement from "@/pages/WorkerManagement";
import BookingManagement from "@/pages/BookingManagement";

// Add routes
<Route path="/admin/workers" component={WorkerManagement} />
<Route path="/admin/bookings" component={BookingManagement} />
```

### 2. Update Dashboard Cards
```tsx
// In AdminDashboard.tsx
<Card 
  className="cursor-pointer transition-all hover:shadow-md border-2 hover:border-green-200"
  onClick={() => setLocation("/admin/workers")}
>
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Total Workers</p>
        <p className="text-2xl font-bold text-green-600">{stats.totalWorkers}</p>
        <p className="text-xs text-muted-foreground">Service providers</p>
      </div>
      <Briefcase className="h-8 w-8 text-green-600" />
    </div>
  </CardContent>
</Card>
```

## Benefits

1. **Code Reusability**: Same template for multiple management pages
2. **Consistent UX**: All management pages have identical interface
3. **Maintainability**: Changes to the template affect all implementations
4. **Type Safety**: Full TypeScript support with configuration validation
5. **Extensibility**: Easy to add new management pages
6. **Performance**: Optimized with React Query caching and pagination

## Template Structure

The template includes:
- **Left Sidebar**: State-based navigation with item counts
- **Right Content Area**: Dynamic views (total, states, districts, items)
- **Search & Filters**: Configurable search and status filtering
- **Data Tables**: Responsive tables with configurable columns
- **Action Dropdowns**: Configurable action menus for each item
- **Pagination**: Built-in pagination for large datasets
- **Loading States**: Consistent loading indicators
- **Empty States**: Customizable empty state messages

## TypeScript Interfaces

```tsx
interface BaseItem {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  mobile?: string;
  role?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  district?: string;
  state?: string;
  status?: string;
  [key: string]: any;
}

interface ManagementConfig {
  // Page Configuration
  title: string;
  backUrl: string;
  totalListLabel: string;
  totalListBadgeColor: string;
  
  // API Configuration
  fetchUrl: string;
  itemRole?: string;
  
  // Display Configuration
  itemDisplayName: (item: BaseItem) => string;
  itemDescription?: (item: BaseItem) => string;
  getItemCountForState: (state: string, items: BaseItem[]) => number;
  getItemCountForDistrict: (district: string, items: BaseItem[]) => number;
  
  // Search Configuration
  searchPlaceholder: string;
  searchFilters: Array<{value: string; label: string}>;
  statusFilters: Array<{value: string; label: string}>;
  
  // Table Configuration
  tableColumns: Array<{
    key: string;
    label: string;
    render: (item: BaseItem) => React.ReactNode;
  }>;
  
  // Actions Configuration
  actions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (item: BaseItem) => void;
    variant?: "default" | "destructive" | "ghost";
    color?: string;
    tooltip?: string;
  }>;
  
  // Permissions
  requiredRoles: string[];
  
  // Styling
  stateItemBadgeColor?: string;
  loadingText?: string;
  emptyStateText?: string;
  emptyStateIcon?: React.ReactNode;
}
```

This template provides a complete, production-ready solution for creating consistent management interfaces across your application.