import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Save, FileText, Info } from "lucide-react";

interface StateData {
  state: string;
  districts: string[];
}

interface DistrictsData {
  states: StateData[];
}

export default function DistrictManager() {
  const [districtsData, setDistrictsData] = useState<DistrictsData | null>(null);
  const [selectedState, setSelectedState] = useState<string>("");
  const [newDistrict, setNewDistrict] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load districts data on component mount
  useEffect(() => {
    loadDistrictsData();
  }, []);

  const loadDistrictsData = async () => {
    try {
      setIsLoading(true);
      // Load from a sample state to get the data structure
      const response = await fetch('/api/districts/India');
      if (response.ok) {
        // Since we can't directly access the JSON file from frontend, 
        // we'll use a workaround to display current data structure
        setDistrictsData({
          states: [
            { state: "India", districts: ["Sample data loaded - use file operations below"] }
          ]
        });
      }
    } catch (error) {
      console.error("Error loading districts data:", error);
      toast({
        title: "Error",
        description: "Failed to load districts data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCurrentData = async () => {
    try {
      // This is a placeholder - in a real implementation, you would need
      // a backend endpoint to serve the raw JSON file
      toast({
        title: "Download Instructions",
        description: "Check the 'shared/states-districts.json' file in your project directory for the current data.",
      });
    } catch (error) {
      console.error("Error downloading data:", error);
      toast({
        title: "Error",
        description: "Failed to download data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">District Data Manager</h1>
        <p className="text-muted-foreground">
          Manage authentic Indian states and districts data used throughout the application
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Data Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Current Data File
            </CardTitle>
            <CardDescription>
              Location: <code className="bg-muted px-2 py-1 rounded">shared/states-districts.json</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Data Source Information:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Authentic Indian government district data</li>
                <li>• 28 States + 8 Union Territories</li>
                <li>• 700+ Districts total</li>
                <li>• Source: GitHub sab99r/Indian-States-And-Districts</li>
              </ul>
            </div>

            <Button onClick={downloadCurrentData} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              View Current Data File Location
            </Button>
          </CardContent>
        </Card>

        {/* File Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Update Data File
            </CardTitle>
            <CardDescription>
              Instructions for updating the districts data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    How to Update Districts Data:
                  </h4>
                  <ol className="space-y-2 text-blue-700 dark:text-blue-300">
                    <li>1. Navigate to <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">shared/states-districts.json</code></li>
                    <li>2. Edit the JSON file directly in the file explorer</li>
                    <li>3. Add/remove states or districts as needed</li>
                    <li>4. Save the file - changes take effect immediately</li>
                    <li>5. Test by selecting states in the registration forms</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                JSON Structure:
              </h4>
              <pre className="text-xs text-yellow-700 dark:text-yellow-300 overflow-x-auto">
{`{
  "states": [
    {
      "state": "Tamil Nadu",
      "districts": [
        "Chennai",
        "Coimbatore",
        "Madurai",
        ...
      ]
    }
  ]
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>Test Districts API</CardTitle>
          <CardDescription>
            Verify that the districts API is working with the current data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="test-state">Test State Name</Label>
              <Input
                id="test-state"
                placeholder="e.g., Tamil Nadu, Telangana, Maharashtra"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={async () => {
                  if (!selectedState.trim()) return;
                  try {
                    const response = await fetch(`/api/districts/${encodeURIComponent(selectedState)}`);
                    const districts = await response.json();
                    toast({
                      title: "API Test Result",
                      description: `Found ${districts.length} districts for ${selectedState}`,
                    });
                  } catch (error) {
                    toast({
                      title: "API Test Failed",
                      description: "Could not fetch districts",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!selectedState.trim()}
              >
                Test API
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}