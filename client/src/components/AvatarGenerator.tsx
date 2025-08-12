import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Download, 
  RefreshCw, 
  Palette, 
  User, 
  Smile,
  Eye,
  Shirt,
  Crown
} from "lucide-react";

interface AvatarConfig {
  backgroundColor: string;
  skinTone: string;
  hairstyle: string;
  hairColor: string;
  eyeStyle: string;
  eyeColor: string;
  mouthStyle: string;
  clothingStyle: string;
  clothingColor: string;
  accessory: string;
  size: number;
}

const defaultConfig: AvatarConfig = {
  backgroundColor: "#f0f0f0",
  skinTone: "#fdbcb4",
  hairstyle: "short",
  hairColor: "#8b4513",
  eyeStyle: "normal",
  eyeColor: "#333333",
  mouthStyle: "smile",
  clothingStyle: "tshirt",
  clothingColor: "#4f46e5",
  accessory: "none",
  size: 200
};

const colorOptions = {
  skin: ["#fdbcb4", "#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#975f3e"],
  hair: ["#000000", "#8b4513", "#daa520", "#ff6347", "#800080", "#4b0082"],
  eyes: ["#333333", "#654321", "#228b22", "#4169e1", "#32cd32", "#800080"],
  clothing: ["#4f46e5", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"],
  background: ["#f0f0f0", "#fef3c7", "#dbeafe", "#fce7f3", "#ecfdf5", "#f3e8ff"]
};

const styleOptions = {
  hairstyle: ["short", "long", "curly", "bald", "ponytail", "buzz"],
  eyeStyle: ["normal", "wide", "sleepy", "wink", "closed", "happy"],
  mouthStyle: ["smile", "neutral", "open", "surprised", "sad", "laugh"],
  clothingStyle: ["tshirt", "shirt", "hoodie", "suit", "tank", "dress"],
  accessory: ["none", "glasses", "hat", "cap", "earrings", "necklace"]
};

export function AvatarGenerator({ onAvatarSave }: { onAvatarSave?: (avatarSvg: string) => void }) {
  const [config, setConfig] = useState<AvatarConfig>(defaultConfig);
  const [isOpen, setIsOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const updateConfig = useCallback((key: keyof AvatarConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const randomizeAvatar = useCallback(() => {
    const randomConfig: AvatarConfig = {
      backgroundColor: colorOptions.background[Math.floor(Math.random() * colorOptions.background.length)],
      skinTone: colorOptions.skin[Math.floor(Math.random() * colorOptions.skin.length)],
      hairstyle: styleOptions.hairstyle[Math.floor(Math.random() * styleOptions.hairstyle.length)],
      hairColor: colorOptions.hair[Math.floor(Math.random() * colorOptions.hair.length)],
      eyeStyle: styleOptions.eyeStyle[Math.floor(Math.random() * styleOptions.eyeStyle.length)],
      eyeColor: colorOptions.eyes[Math.floor(Math.random() * colorOptions.eyes.length)],
      mouthStyle: styleOptions.mouthStyle[Math.floor(Math.random() * styleOptions.mouthStyle.length)],
      clothingStyle: styleOptions.clothingStyle[Math.floor(Math.random() * styleOptions.clothingStyle.length)],
      clothingColor: colorOptions.clothing[Math.floor(Math.random() * colorOptions.clothing.length)],
      accessory: styleOptions.accessory[Math.floor(Math.random() * styleOptions.accessory.length)],
      size: config.size
    };
    setConfig(randomConfig);
  }, [config.size]);

  const generateAvatarSVG = useCallback(() => {
    const { size, backgroundColor, skinTone, hairstyle, hairColor, eyeStyle, eyeColor, mouthStyle, clothingStyle, clothingColor, accessory } = config;
    
    // Head and face
    const faceRadius = size * 0.35;
    const centerX = size / 2;
    const centerY = size / 2;

    // Hair paths based on style
    const getHairPath = () => {
      switch (hairstyle) {
        case "short":
          return `M ${centerX - faceRadius * 0.8} ${centerY - faceRadius * 0.6} Q ${centerX} ${centerY - faceRadius * 1.2} ${centerX + faceRadius * 0.8} ${centerY - faceRadius * 0.6}`;
        case "long":
          return `M ${centerX - faceRadius} ${centerY - faceRadius * 0.8} Q ${centerX} ${centerY - faceRadius * 1.3} ${centerX + faceRadius} ${centerY - faceRadius * 0.8} L ${centerX + faceRadius * 1.2} ${centerY + faceRadius * 0.5} Q ${centerX} ${centerY + faceRadius * 0.8} ${centerX - faceRadius * 1.2} ${centerY + faceRadius * 0.5} Z`;
        case "curly":
          return `M ${centerX - faceRadius * 0.9} ${centerY - faceRadius * 0.7} Q ${centerX - faceRadius * 0.3} ${centerY - faceRadius * 1.3} ${centerX} ${centerY - faceRadius * 1.1} Q ${centerX + faceRadius * 0.3} ${centerY - faceRadius * 1.3} ${centerX + faceRadius * 0.9} ${centerY - faceRadius * 0.7}`;
        case "ponytail":
          return `M ${centerX - faceRadius * 0.7} ${centerY - faceRadius * 0.5} Q ${centerX} ${centerY - faceRadius * 1.1} ${centerX + faceRadius * 0.7} ${centerY - faceRadius * 0.5} M ${centerX + faceRadius * 0.8} ${centerY - faceRadius * 0.3} Q ${centerX + faceRadius * 1.2} ${centerY} ${centerX + faceRadius} ${centerY + faceRadius * 0.3}`;
        case "buzz":
          return `M ${centerX - faceRadius * 0.6} ${centerY - faceRadius * 0.4} Q ${centerX} ${centerY - faceRadius * 0.8} ${centerX + faceRadius * 0.6} ${centerY - faceRadius * 0.4}`;
        default:
          return "";
      }
    };

    // Eyes based on style
    const getEyes = () => {
      const eyeY = centerY - faceRadius * 0.2;
      const leftEyeX = centerX - faceRadius * 0.3;
      const rightEyeX = centerX + faceRadius * 0.3;
      
      switch (eyeStyle) {
        case "wide":
          return `<circle cx="${leftEyeX}" cy="${eyeY}" r="${faceRadius * 0.08}" fill="${eyeColor}"/>
                  <circle cx="${rightEyeX}" cy="${eyeY}" r="${faceRadius * 0.08}" fill="${eyeColor}"/>`;
        case "sleepy":
          return `<ellipse cx="${leftEyeX}" cy="${eyeY}" rx="${faceRadius * 0.08}" ry="${faceRadius * 0.04}" fill="${eyeColor}"/>
                  <ellipse cx="${rightEyeX}" cy="${eyeY}" rx="${faceRadius * 0.08}" ry="${faceRadius * 0.04}" fill="${eyeColor}"/>`;
        case "wink":
          return `<path d="M ${leftEyeX - faceRadius * 0.06} ${eyeY} Q ${leftEyeX} ${eyeY - faceRadius * 0.03} ${leftEyeX + faceRadius * 0.06} ${eyeY}" stroke="${eyeColor}" stroke-width="2" fill="none"/>
                  <circle cx="${rightEyeX}" cy="${eyeY}" r="${faceRadius * 0.06}" fill="${eyeColor}"/>`;
        case "closed":
          return `<path d="M ${leftEyeX - faceRadius * 0.06} ${eyeY} Q ${leftEyeX} ${eyeY - faceRadius * 0.02} ${leftEyeX + faceRadius * 0.06} ${eyeY}" stroke="${eyeColor}" stroke-width="2" fill="none"/>
                  <path d="M ${rightEyeX - faceRadius * 0.06} ${eyeY} Q ${rightEyeX} ${eyeY - faceRadius * 0.02} ${rightEyeX + faceRadius * 0.06} ${eyeY}" stroke="${eyeColor}" stroke-width="2" fill="none"/>`;
        case "happy":
          return `<path d="M ${leftEyeX - faceRadius * 0.06} ${eyeY + faceRadius * 0.02} Q ${leftEyeX} ${eyeY - faceRadius * 0.02} ${leftEyeX + faceRadius * 0.06} ${eyeY + faceRadius * 0.02}" stroke="${eyeColor}" stroke-width="2" fill="none"/>
                  <path d="M ${rightEyeX - faceRadius * 0.06} ${eyeY + faceRadius * 0.02} Q ${rightEyeX} ${eyeY - faceRadius * 0.02} ${rightEyeX + faceRadius * 0.06} ${eyeY + faceRadius * 0.02}" stroke="${eyeColor}" stroke-width="2" fill="none"/>`;
        default:
          return `<circle cx="${leftEyeX}" cy="${eyeY}" r="${faceRadius * 0.06}" fill="${eyeColor}"/>
                  <circle cx="${rightEyeX}" cy="${eyeY}" r="${faceRadius * 0.06}" fill="${eyeColor}"/>`;
      }
    };

    // Mouth based on style
    const getMouth = () => {
      const mouthY = centerY + faceRadius * 0.3;
      
      switch (mouthStyle) {
        case "smile":
          return `<path d="M ${centerX - faceRadius * 0.2} ${mouthY} Q ${centerX} ${mouthY + faceRadius * 0.1} ${centerX + faceRadius * 0.2} ${mouthY}" stroke="#ff6b6b" stroke-width="3" fill="none"/>`;
        case "neutral":
          return `<line x1="${centerX - faceRadius * 0.1}" y1="${mouthY}" x2="${centerX + faceRadius * 0.1}" y2="${mouthY}" stroke="#ff6b6b" stroke-width="2"/>`;
        case "open":
          return `<ellipse cx="${centerX}" cy="${mouthY}" rx="${faceRadius * 0.08}" ry="${faceRadius * 0.12}" fill="#2c2c2c"/>`;
        case "surprised":
          return `<circle cx="${centerX}" cy="${mouthY}" r="${faceRadius * 0.06}" fill="#2c2c2c"/>`;
        case "sad":
          return `<path d="M ${centerX - faceRadius * 0.2} ${mouthY + faceRadius * 0.05} Q ${centerX} ${mouthY - faceRadius * 0.05} ${centerX + faceRadius * 0.2} ${mouthY + faceRadius * 0.05}" stroke="#ff6b6b" stroke-width="3" fill="none"/>`;
        case "laugh":
          return `<path d="M ${centerX - faceRadius * 0.25} ${mouthY - faceRadius * 0.02} Q ${centerX} ${mouthY + faceRadius * 0.15} ${centerX + faceRadius * 0.25} ${mouthY - faceRadius * 0.02}" stroke="#ff6b6b" stroke-width="4" fill="none"/>`;
        default:
          return `<path d="M ${centerX - faceRadius * 0.15} ${mouthY} Q ${centerX} ${mouthY + faceRadius * 0.08} ${centerX + faceRadius * 0.15} ${mouthY}" stroke="#ff6b6b" stroke-width="2" fill="none"/>`;
      }
    };

    // Clothing
    const getClothing = () => {
      const clothingY = centerY + faceRadius * 0.8;
      const clothingWidth = faceRadius * 1.2;
      
      switch (clothingStyle) {
        case "tshirt":
          return `<rect x="${centerX - clothingWidth / 2}" y="${clothingY}" width="${clothingWidth}" height="${size * 0.3}" fill="${clothingColor}" rx="10"/>`;
        case "shirt":
          return `<rect x="${centerX - clothingWidth / 2}" y="${clothingY}" width="${clothingWidth}" height="${size * 0.3}" fill="${clothingColor}" rx="5"/>
                  <line x1="${centerX}" y1="${clothingY}" x2="${centerX}" y2="${clothingY + size * 0.3}" stroke="#ffffff" stroke-width="2"/>`;
        case "hoodie":
          return `<rect x="${centerX - clothingWidth / 2}" y="${clothingY}" width="${clothingWidth}" height="${size * 0.3}" fill="${clothingColor}" rx="15"/>
                  <circle cx="${centerX}" cy="${clothingY + 20}" r="8" fill="none" stroke="#ffffff" stroke-width="2"/>`;
        case "suit":
          return `<rect x="${centerX - clothingWidth / 2}" y="${clothingY}" width="${clothingWidth}" height="${size * 0.3}" fill="#2c2c2c" rx="5"/>
                  <rect x="${centerX - clothingWidth / 4}" y="${clothingY + 10}" width="${clothingWidth / 2}" height="${size * 0.25}" fill="${clothingColor}" rx="3"/>`;
        case "tank":
          return `<rect x="${centerX - clothingWidth / 3}" y="${clothingY}" width="${clothingWidth * 0.66}" height="${size * 0.3}" fill="${clothingColor}" rx="8"/>`;
        case "dress":
          return `<path d="M ${centerX - clothingWidth / 2} ${clothingY} L ${centerX + clothingWidth / 2} ${clothingY} L ${centerX + clothingWidth * 0.8} ${clothingY + size * 0.3} L ${centerX - clothingWidth * 0.8} ${clothingY + size * 0.3} Z" fill="${clothingColor}"/>`;
        default:
          return `<rect x="${centerX - clothingWidth / 2}" y="${clothingY}" width="${clothingWidth}" height="${size * 0.3}" fill="${clothingColor}" rx="10"/>`;
      }
    };

    // Accessories
    const getAccessory = () => {
      switch (accessory) {
        case "glasses":
          return `<circle cx="${centerX - faceRadius * 0.3}" cy="${centerY - faceRadius * 0.2}" r="${faceRadius * 0.12}" fill="none" stroke="#2c2c2c" stroke-width="2"/>
                  <circle cx="${centerX + faceRadius * 0.3}" cy="${centerY - faceRadius * 0.2}" r="${faceRadius * 0.12}" fill="none" stroke="#2c2c2c" stroke-width="2"/>
                  <line x1="${centerX - faceRadius * 0.18}" y1="${centerY - faceRadius * 0.2}" x2="${centerX + faceRadius * 0.18}" y2="${centerY - faceRadius * 0.2}" stroke="#2c2c2c" stroke-width="2"/>`;
        case "hat":
          return `<ellipse cx="${centerX}" cy="${centerY - faceRadius * 0.9}" rx="${faceRadius * 0.8}" ry="${faceRadius * 0.2}" fill="#8b4513"/>
                  <rect x="${centerX - faceRadius * 0.6}" y="${centerY - faceRadius * 1.1}" width="${faceRadius * 1.2}" height="${faceRadius * 0.3}" fill="#8b4513" rx="5"/>`;
        case "cap":
          return `<path d="M ${centerX - faceRadius * 0.7} ${centerY - faceRadius * 0.6} Q ${centerX} ${centerY - faceRadius * 1.1} ${centerX + faceRadius * 0.7} ${centerY - faceRadius * 0.6}" fill="#ff4444"/>
                  <ellipse cx="${centerX + faceRadius * 0.9}" cy="${centerY - faceRadius * 0.4}" rx="${faceRadius * 0.3}" ry="${faceRadius * 0.1}" fill="#ff4444"/>`;
        case "earrings":
          return `<circle cx="${centerX - faceRadius * 0.5}" cy="${centerY}" r="${faceRadius * 0.04}" fill="#ffd700"/>
                  <circle cx="${centerX + faceRadius * 0.5}" cy="${centerY}" r="${faceRadius * 0.04}" fill="#ffd700"/>`;
        case "necklace":
          return `<circle cx="${centerX}" cy="${centerY + faceRadius * 0.6}" r="${faceRadius * 0.08}" fill="#ffd700"/>
                  <path d="M ${centerX - faceRadius * 0.3} ${centerY + faceRadius * 0.5} Q ${centerX} ${centerY + faceRadius * 0.55} ${centerX + faceRadius * 0.3} ${centerY + faceRadius * 0.5}" stroke="#ffd700" stroke-width="3" fill="none"/>`;
        default:
          return "";
      }
    };

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="${size}" height="${size}" fill="${backgroundColor}" rx="20"/>
        
        <!-- Clothing (behind face) -->
        ${getClothing()}
        
        <!-- Face -->
        <circle cx="${centerX}" cy="${centerY}" r="${faceRadius}" fill="${skinTone}"/>
        
        <!-- Hair -->
        ${hairstyle !== "bald" ? `<path d="${getHairPath()}" fill="${hairColor}"/>` : ""}
        
        <!-- Eyes -->
        ${getEyes()}
        
        <!-- Mouth -->
        ${getMouth()}
        
        <!-- Accessories -->
        ${getAccessory()}
      </svg>
    `.trim();
  }, [config]);

  const downloadAvatar = useCallback(() => {
    const svgString = generateAvatarSVG();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'avatar.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [generateAvatarSVG]);

  const saveAvatar = useCallback(() => {
    const svgString = generateAvatarSVG();
    onAvatarSave?.(svgString);
    setIsOpen(false);
  }, [generateAvatarSVG, onAvatarSave]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          Create Avatar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Avatar Generator
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Avatar Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div 
                  className="border-2 border-gray-200 rounded-lg p-4"
                  dangerouslySetInnerHTML={{ __html: generateAvatarSVG() }}
                />
                
                <div className="flex gap-2">
                  <Button onClick={randomizeAvatar} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Randomize
                  </Button>
                  <Button onClick={downloadAvatar} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  {onAvatarSave && (
                    <Button onClick={saveAvatar} size="sm">
                      Save Avatar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customization Options */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <Tabs defaultValue="appearance" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="appearance">
                      <Smile className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="style">
                      <Crown className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="clothing">
                      <Shirt className="w-4 h-4" />
                    </TabsTrigger>
                    <TabsTrigger value="colors">
                      <Palette className="w-4 h-4" />
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="appearance" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Hairstyle</label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {styleOptions.hairstyle.map((style) => (
                          <Button
                            key={style}
                            variant={config.hairstyle === style ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateConfig('hairstyle', style)}
                            className="capitalize"
                          >
                            {style}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Eyes</label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {styleOptions.eyeStyle.map((style) => (
                          <Button
                            key={style}
                            variant={config.eyeStyle === style ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateConfig('eyeStyle', style)}
                            className="capitalize"
                          >
                            {style}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Mouth</label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {styleOptions.mouthStyle.map((style) => (
                          <Button
                            key={style}
                            variant={config.mouthStyle === style ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateConfig('mouthStyle', style)}
                            className="capitalize"
                          >
                            {style}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="style" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Accessories</label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {styleOptions.accessory.map((accessory) => (
                          <Button
                            key={accessory}
                            variant={config.accessory === accessory ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateConfig('accessory', accessory)}
                            className="capitalize"
                          >
                            {accessory}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Size: {config.size}px</label>
                      <Slider
                        value={[config.size]}
                        onValueChange={(value) => updateConfig('size', value[0])}
                        max={300}
                        min={100}
                        step={10}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="clothing" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Clothing Style</label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {styleOptions.clothingStyle.map((style) => (
                          <Button
                            key={style}
                            variant={config.clothingStyle === style ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateConfig('clothingStyle', style)}
                            className="capitalize"
                          >
                            {style}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Clothing Color</label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {colorOptions.clothing.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateConfig('clothingColor', color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              config.clothingColor === color ? 'border-gray-900' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="colors" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Skin Tone</label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {colorOptions.skin.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateConfig('skinTone', color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              config.skinTone === color ? 'border-gray-900' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Hair Color</label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {colorOptions.hair.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateConfig('hairColor', color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              config.hairColor === color ? 'border-gray-900' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Eye Color</label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {colorOptions.eyes.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateConfig('eyeColor', color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              config.eyeColor === color ? 'border-gray-900' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Background</label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {colorOptions.background.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateConfig('backgroundColor', color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              config.backgroundColor === color ? 'border-gray-900' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}