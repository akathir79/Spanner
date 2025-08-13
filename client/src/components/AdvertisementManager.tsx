import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash, Image as ImageIcon, Eye, EyeOff } from "lucide-react";

interface Advertisement {
  id: string;
  title: string;
  description?: string;
  image?: string;
  targetAudience: string;
  link?: string;
  buttonText?: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdvertisementManager() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    targetAudience: "client",
    link: "",
    buttonText: "Learn More",
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    textColor: "#ffffff",
    isActive: true,
    priority: 0,
    startDate: "",
    endDate: ""
  });

  // Fetch advertisements
  const { data: advertisements = [], isLoading } = useQuery({
    queryKey: ["/api/advertisements"],
  });

  // Create advertisement
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/advertisements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      toast({
        title: "Success",
        description: "Advertisement created successfully",
      });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create advertisement",
        variant: "destructive",
      });
    },
  });

  // Update advertisement
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PUT", `/api/advertisements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      toast({
        title: "Success",
        description: "Advertisement updated successfully",
      });
      setEditingAd(null);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update advertisement",
        variant: "destructive",
      });
    },
  });

  // Delete advertisement
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/advertisements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/advertisements"] });
      toast({
        title: "Success",
        description: "Advertisement deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete advertisement",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image: "",
      targetAudience: "client",
      link: "",
      buttonText: "Learn More",
      backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      textColor: "#ffffff",
      isActive: true,
      priority: 0,
      startDate: "",
      endDate: ""
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAd) {
      updateMutation.mutate({ id: editingAd.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      image: ad.image || "",
      targetAudience: ad.targetAudience,
      link: ad.link || "",
      buttonText: ad.buttonText || "Learn More",
      backgroundColor: ad.backgroundColor || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      textColor: ad.textColor || "#ffffff",
      isActive: ad.isActive,
      priority: ad.priority,
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : "",
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : ""
    });
    setIsCreateOpen(true);
  };

  const handleToggleActive = (ad: Advertisement) => {
    updateMutation.mutate({ 
      id: ad.id, 
      data: { isActive: !ad.isActive }
    });
  };

  const gradientOptions = [
    { value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", label: "Purple Gradient" },
    { value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", label: "Pink Gradient" },
    { value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", label: "Blue Gradient" },
    { value: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", label: "Green Gradient" },
    { value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)", label: "Sunset Gradient" },
    { value: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)", label: "Ocean Gradient" },
    { value: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)", label: "Soft Pink" },
    { value: "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)", label: "Pastel Dream" },
    { value: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", label: "Warm Peach" },
    { value: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", label: "Cotton Candy" },
    { value: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)", label: "Lavender" },
    { value: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)", label: "Sky Blue" },
    { value: "#ffffff", label: "White" },
    { value: "#000000", label: "Black" },
    { value: "#f3f4f6", label: "Light Gray" },
    { value: "#1f2937", label: "Dark Gray" },
  ];
  
  // Sample advertisement templates
  const sampleAds = {
    client: [
      {
        title: "Get Quality Service Today!",
        description: "Connect with verified professionals in your area. Fast, reliable, and affordable services.",
        targetAudience: "client",
        buttonText: "Find Workers",
        backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        textColor: "#ffffff",
        link: "/search",
        priority: 1
      },
      {
        title: "Special Discount - 20% Off",
        description: "Book your first service and get 20% off! Limited time offer for new customers.",
        targetAudience: "client",
        buttonText: "Claim Offer",
        backgroundColor: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        textColor: "#ffffff",
        link: "/offers",
        priority: 2
      }
    ],
    worker: [
      {
        title: "Grow Your Business",
        description: "Join thousands of skilled workers earning more with SPANNER. Get more jobs in your area.",
        targetAudience: "worker",
        buttonText: "View Jobs",
        backgroundColor: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        textColor: "#ffffff",
        link: "/jobs",
        priority: 1
      },
      {
        title: "Premium Membership Benefits",
        description: "Upgrade to premium and get priority in job listings, advanced analytics, and more!",
        targetAudience: "worker",
        buttonText: "Upgrade Now",
        backgroundColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        textColor: "#ffffff",
        link: "/premium",
        priority: 2
      }
    ]
  };
  
  const createSampleAds = () => {
    const samples = [...sampleAds.client, ...sampleAds.worker];
    samples.forEach((sample, index) => {
      setTimeout(() => {
        createMutation.mutate({
          ...sample,
          isActive: true,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }, index * 500); // Stagger creation to avoid overwhelming the server
    });
  };

  if (isLoading) {
    return <div>Loading advertisements...</div>;
  }

  return (
    <div>
      <div className="flex justify-end items-center mb-4 gap-2">
        {advertisements.length === 0 && (
          <Button variant="outline" onClick={createSampleAds}>
            Generate Sample Ads
          </Button>
        )}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingAd(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Advertisement
            </Button>
          </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAd ? "Edit Advertisement" : "Create New Advertisement"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
                    >
                      <SelectTrigger id="targetAudience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Clients</SelectItem>
                        <SelectItem value="worker">Workers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="image">Advertisement Image</Label>
                  <div className="space-y-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    {formData.image && (
                      <div className="mt-2">
                        <img 
                          src={formData.image} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="link">Link (optional)</Label>
                    <Input
                      id="link"
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input
                      id="buttonText"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="backgroundColor">Background</Label>
                    <Select
                      value={formData.backgroundColor}
                      onValueChange={(value) => setFormData({ ...formData, backgroundColor: value })}
                    >
                      <SelectTrigger id="backgroundColor">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gradientOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="textColor">Text Color</Label>
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAd ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-4">
          {advertisements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No advertisements created yet
            </p>
          ) : (
            advertisements.map((ad: Advertisement) => (
              <div
                key={ad.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {ad.image && (
                    <img
                      src={ad.image}
                      alt={ad.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{ad.title}</h3>
                    <p className="text-sm text-muted-foreground">{ad.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={ad.targetAudience === "client" ? "default" : "secondary"}>
                        {ad.targetAudience}
                      </Badge>
                      <Badge variant={ad.isActive ? "success" : "outline"}>
                        {ad.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Priority: {ad.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleActive(ad)}
                  >
                    {ad.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(ad)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(ad.id)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
      </div>
    </div>
  );
}