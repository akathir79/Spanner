import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone } from "lucide-react";

interface WorkerCardProps {
  id: string;
  name: string;
  service: string;
  location: string;
  rating: number;
  reviews: number;
  hourlyRate: string;
  experience: string;
  isAvailable: boolean;
  avatar?: string;
  onContact: (workerId: string) => void;
}

export function WorkerCard({
  id,
  name,
  service,
  location,
  rating,
  reviews,
  hourlyRate,
  experience,
  isAvailable,
  avatar,
  onContact,
}: WorkerCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      {avatar && (
        <div className="aspect-square w-full overflow-hidden rounded-t-lg">
          <img 
            src={avatar} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="text-center mb-4">
          {avatar ? (
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 border-2 border-gray-200">
              <img 
                src={avatar} 
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">{name.charAt(0)}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-2">
            <h5 className="font-semibold text-lg">{name}</h5>
            {isAvailable && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Available
              </Badge>
            )}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-2">{service}</p>
        
        <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3 w-3" />
          <span>{location}</span>
        </div>
        
        <div className="flex items-center space-x-1 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${
                  i < Math.floor(rating) 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "text-gray-300"
                }`} 
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {rating} ({reviews} reviews)
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-green-600">{hourlyRate}</span>
          <span className="text-sm text-muted-foreground">{experience}</span>
        </div>
        
        <Button 
          onClick={() => onContact(id)}
          className="w-full"
          size="sm"
        >
          <Phone className="h-4 w-4 mr-2" />
          Contact Now
        </Button>
      </CardContent>
    </Card>
  );
}
