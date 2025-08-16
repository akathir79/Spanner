import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import FinancialManagement from "@/components/FinancialManagement";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function FinancialManagementPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not admin
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    setLocation('/');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/admin-dashboard')}
            className="flex items-center space-x-2"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-3xl font-bold">Financial Management System</h1>
        </div>
      </div>

      {/* Financial Management Component */}
      <FinancialManagement />
    </div>
  );
}

export default FinancialManagementPage;