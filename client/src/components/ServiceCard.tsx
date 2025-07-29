import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface ServiceCardProps {
  name: string;
  description: string;
  icon: string;
  price: string;
  rating: number;
  reviews: number;
  image?: string;
  onClick?: () => void;
}

export function ServiceCard({ 
  name, 
  description, 
  icon, 
  price, 
  rating, 
  reviews, 
  image,
  onClick 
}: ServiceCardProps) {
  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      onClick={onClick}
    >
      {image && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className={`${icon} text-primary text-2xl`} />
          </div>
          <h5 className="font-semibold text-lg">{name}</h5>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="flex justify-between items-center">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
            {price}
          </Badge>
          
          <div className="flex items-center space-x-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating}</span>
            <span className="text-muted-foreground">({reviews} reviews)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
