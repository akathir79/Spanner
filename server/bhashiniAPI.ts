import fetch from 'node-fetch';

export interface BhashiniConfig {
  userId: string;
  ulcaApiKey: string;
  pipelineId: string;
}

export interface BhashiniASRResult {
  detectedLanguage: string;
  transcript: string;
  translatedText: string;
  confidence?: number;
}

export class BhashiniAPI {
  private baseUrl = 'https://meity-auth.ulcacontrib.org';
  private config: BhashiniConfig;
  private serviceIds: {
    asr?: string;
    nmt?: string;
    tts?: string;
  } = {};

  constructor(config: BhashiniConfig) {
    this.config = config;
  }

  private async initializeServiceIds() {
    if (this.serviceIds.asr) return; // Already initialized

    try {
      const configBody = {
        pipelineTasks: [
          { taskType: "asr" },
          { taskType: "translation" },
          { taskType: "tts" }
        ],
        pipelineRequestConfig: {
          pipelineId: this.config.pipelineId
        }
      };

      const response = await fetch(`${this.baseUrl}/ulca/apis/v0/model/getModelsPipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userID': this.config.userId,
          'ulcaApiKey': this.config.ulcaApiKey
        },
        body: JSON.stringify(configBody)
      });

      if (!response.ok) {
        throw new Error(`Config API failed: ${response.statusText}`);
      }

      const configData = await response.json() as any;
      
      // Extract service IDs from response
      if (configData.pipelineResponseConfig) {
        const configs = configData.pipelineResponseConfig;
        
        // Find ASR service ID
        const asrConfig = configs.find((c: any) => 
          c.config?.some((cfg: any) => cfg.serviceId?.includes('asr') || cfg.serviceId?.includes('conformer'))
        );
        if (asrConfig) {
          this.serviceIds.asr = asrConfig.config[0].serviceId;
        }

        // Find NMT service ID  
        const nmtConfig = configs.find((c: any) => 
          c.config?.some((cfg: any) => cfg.serviceId?.includes('nmt') || cfg.serviceId?.includes('translation'))
        );
        if (nmtConfig) {
          this.serviceIds.nmt = nmtConfig.config[0].serviceId;
        }

        // Find TTS service ID
        const ttsConfig = configs.find((c: any) => 
          c.config?.some((cfg: any) => cfg.serviceId?.includes('tts') || cfg.serviceId?.includes('speech'))
        );
        if (ttsConfig) {
          this.serviceIds.tts = ttsConfig.config[0].serviceId;
        }
      }

      console.log('Bhashini service IDs initialized:', this.serviceIds);
    } catch (error) {
      console.error('Failed to initialize Bhashini service IDs:', error);
      // Fallback service IDs (these may need to be updated based on available models)
      this.serviceIds.asr = 'ai4bharat/conformer-multilingual-indo_aryan-gpu--t4';
      this.serviceIds.nmt = 'ai4bharat/indictrans-v2-all-gpu--t4';
      this.serviceIds.tts = 'ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4';
    }
  }

  // Speech-to-text with automatic language detection and translation to English
  async speechToTextAndTranslate(audioBase64: string, sourceLanguage?: string): Promise<BhashiniASRResult> {
    await this.initializeServiceIds();

    if (!this.serviceIds.asr || !this.serviceIds.nmt) {
      throw new Error('Bhashini service IDs not properly initialized');
    }

    // If source language not provided, try multiple common Indian languages
    const languagesToTry = sourceLanguage ? [sourceLanguage] : ['ta', 'hi', 'te', 'ml', 'kn', 'gu', 'mr', 'bn'];
    
    for (const lang of languagesToTry) {
      try {
        const computeBody = {
          pipelineTasks: [
            {
              taskType: "asr",
              config: {
                language: { sourceLanguage: lang },
                serviceId: this.serviceIds.asr,
                audioFormat: "wav",
                samplingRate: 16000
              }
            },
            {
              taskType: "translation",
              config: {
                language: {
                  sourceLanguage: lang,
                  targetLanguage: "en"
                },
                serviceId: this.serviceIds.nmt
              }
            }
          ],
          inputData: {
            input: [{ source: null }],
            audio: [{ audioContent: audioBase64 }]
          }
        };

        const response = await fetch(`${this.baseUrl}/ulca/apis/v0/model/compute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'userID': this.config.userId,
            'ulcaApiKey': this.config.ulcaApiKey
          },
          body: JSON.stringify(computeBody)
        });

        if (!response.ok) {
          if (sourceLanguage) {
            throw new Error(`ASR API failed: ${response.statusText}`);
          }
          continue; // Try next language
        }

        const result = await response.json() as any;
        
        if (result.pipelineResponse && result.pipelineResponse.length >= 2) {
          const asrResult = result.pipelineResponse[0];
          const nmtResult = result.pipelineResponse[1];
          
          const transcript = asrResult.output?.[0]?.source || '';
          const translatedText = nmtResult.output?.[0]?.target || transcript;
          
          if (transcript && transcript.trim()) {
            return {
              detectedLanguage: lang,
              transcript: transcript,
              translatedText: translatedText,
              confidence: 0.9 // Bhashini doesn't provide confidence scores
            };
          }
        }
        
        if (sourceLanguage) break; // Don't try other languages if specific language was requested
      } catch (error) {
        console.error(`Error processing language ${lang}:`, error);
        if (sourceLanguage) throw error; // Throw error if specific language was requested
      }
    }

    throw new Error('Failed to process audio with Bhashini API');
  }

  // Translate text between Indian languages
  async translateText(text: string, sourceLanguage: string, targetLanguage: string = 'en'): Promise<string> {
    await this.initializeServiceIds();

    if (!this.serviceIds.nmt) {
      throw new Error('Bhashini translation service not available');
    }

    const computeBody = {
      pipelineTasks: [
        {
          taskType: "translation",
          config: {
            language: {
              sourceLanguage: sourceLanguage,
              targetLanguage: targetLanguage
            },
            serviceId: this.serviceIds.nmt
          }
        }
      ],
      inputData: {
        input: [{ source: text }]
      }
    };

    const response = await fetch(`${this.baseUrl}/ulca/apis/v0/model/compute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'userID': this.config.userId,
        'ulcaApiKey': this.config.ulcaApiKey
      },
      body: JSON.stringify(computeBody)
    });

    if (!response.ok) {
      throw new Error(`Translation API failed: ${response.statusText}`);
    }

    const result = await response.json() as any;
    return result.pipelineResponse?.[0]?.output?.[0]?.target || text;
  }

  // Detect language of text (basic heuristic method since Bhashini doesn't have dedicated language detection)
  detectLanguage(text: string): string {
    // Basic script detection for Indian languages
    const devanagariPattern = /[\u0900-\u097F]/;
    const tamilPattern = /[\u0B80-\u0BFF]/;
    const teluguPattern = /[\u0C00-\u0C7F]/;
    const kannadaPattern = /[\u0C80-\u0CFF]/;
    const malayalamPattern = /[\u0D00-\u0D7F]/;
    const gujaratiPattern = /[\u0A80-\u0AFF]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const gurmukhiPattern = /[\u0A00-\u0A7F]/;

    if (tamilPattern.test(text)) return 'ta';
    if (teluguPattern.test(text)) return 'te';
    if (kannadaPattern.test(text)) return 'kn';
    if (malayalamPattern.test(text)) return 'ml';
    if (devanagariPattern.test(text)) return 'hi'; // Could also be mr, ne, etc.
    if (gujaratiPattern.test(text)) return 'gu';
    if (bengaliPattern.test(text)) return 'bn';
    if (gurmukhiPattern.test(text)) return 'pa';
    
    // Default to English if no Indian script detected
    return 'en';
  }

  // Get language name from code
  getLanguageName(code: string): string {
    const languageMap: { [key: string]: string } = {
      'ta': 'Tamil',
      'hi': 'Hindi',
      'te': 'Telugu',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'gu': 'Gujarati',
      'mr': 'Marathi',
      'bn': 'Bengali',
      'pa': 'Punjabi',
      'or': 'Odia',
      'as': 'Assamese',
      'en': 'English'
    };
    
    return languageMap[code] || 'Unknown';
  }
}

// Create default instance with environment variables
export function createBhashiniAPI(): BhashiniAPI | null {
  const userId = process.env.BHASHINI_USER_ID;
  const ulcaApiKey = process.env.BHASHINI_ULCA_API_KEY;
  const pipelineId = process.env.BHASHINI_PIPELINE_ID || '64392f96daac500b55c543cd'; // Default pipeline

  if (!userId || !ulcaApiKey) {
    console.error('Bhashini credentials not configured');
    return null;
  }

  return new BhashiniAPI({
    userId,
    ulcaApiKey,
    pipelineId
  });
}