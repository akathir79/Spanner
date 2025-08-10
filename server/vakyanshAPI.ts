import fetch from 'node-fetch';

// Vakyansh API Service for EkStep Speech Recognition
// Supports 39 Indian languages with no authentication required

interface VakyanshConfig {
  language: string;
  audioFormat: string;
  encoding: string;
  samplingRate: number;
}

interface VakyanshResponse {
  transcript: string;
  confidence: number;
  language: string;
  success: boolean;
  error?: string;
}

export class VakyanshAPI {
  private readonly baseUrl = 'https://cdac.ulcacontrib.org/asr/v1/recognize';
  
  // Language mapping for Vakyansh API
  private readonly languageMap: { [key: string]: string } = {
    'ta': 'ta',     // Tamil
    'hi': 'hi',     // Hindi
    'te': 'te',     // Telugu
    'ml': 'ml',     // Malayalam
    'kn': 'kn',     // Kannada
    'gu': 'gu',     // Gujarati
    'pa': 'pa',     // Punjabi
    'bn': 'bn',     // Bengali
    'en': 'en',     // English
    'mr': 'mr',     // Marathi
    'or': 'or',     // Odia
    'as': 'as',     // Assamese
    'ur': 'ur',     // Urdu
    'bho': 'bho',   // Bhojpuri
    'raj': 'raj'    // Rajasthani
  };

  async recognizeSpeech(audioBase64: string, detectedLanguage?: string): Promise<VakyanshResponse> {
    try {
      // Default to Hindi if no language detected
      const langCode = detectedLanguage && this.languageMap[detectedLanguage] 
        ? this.languageMap[detectedLanguage] 
        : 'hi';

      const config: VakyanshConfig = {
        language: langCode,
        audioFormat: 'wav',
        encoding: 'base64',
        samplingRate: 16000
      };

      const requestBody = {
        audio: audioBase64,
        config: config
      };

      console.log(`🎙️ Vakyansh ASR Request for language: ${langCode}`);
      
      const response = await fetch(`${this.baseUrl}/${langCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Vakyansh API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as any;
      
      // Parse Vakyansh response format
      const transcript = result.transcript || result.output || result.text || '';
      const confidence = result.confidence || 0.8;

      console.log(`✅ Vakyansh transcription successful: "${transcript}"`);

      return {
        transcript,
        confidence,
        language: langCode,
        success: true
      };

    } catch (error) {
      console.error('❌ Vakyansh API Error:', error);
      
      return {
        transcript: '',
        confidence: 0,
        language: detectedLanguage || 'hi',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Language detection using heuristic patterns (since Vakyansh doesn't include language detection)
  detectLanguage(text: string): string {
    // Simple pattern-based language detection for common Indian languages
    const patterns = {
      'ta': /[\u0B80-\u0BFF]/,     // Tamil
      'hi': /[\u0900-\u097F]/,     // Hindi/Devanagari
      'te': /[\u0C00-\u0C7F]/,     // Telugu
      'ml': /[\u0D00-\u0D7F]/,     // Malayalam
      'kn': /[\u0C80-\u0CFF]/,     // Kannada
      'gu': /[\u0A80-\u0AFF]/,     // Gujarati
      'pa': /[\u0A00-\u0A7F]/,     // Punjabi
      'bn': /[\u0980-\u09FF]/,     // Bengali
      'mr': /[\u0900-\u097F]/,     // Marathi (shares script with Hindi)
      'or': /[\u0B00-\u0B7F]/,     // Odia
      'as': /[\u0980-\u09FF]/,     // Assamese (shares script with Bengali)
      'ur': /[\u0600-\u06FF]/      // Urdu
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }

    // Default to Hindi for Indian context
    return 'hi';
  }

  // Get human-readable language name
  getLanguageName(code: string): string {
    const nameMap: { [key: string]: string } = {
      'ta': 'Tamil',
      'hi': 'Hindi',
      'te': 'Telugu',
      'ml': 'Malayalam',
      'kn': 'Kannada',
      'gu': 'Gujarati',
      'pa': 'Punjabi',
      'bn': 'Bengali',
      'en': 'English',
      'mr': 'Marathi',
      'or': 'Odia',
      'as': 'Assamese',
      'ur': 'Urdu',
      'bho': 'Bhojpuri',
      'raj': 'Rajasthani'
    };

    return nameMap[code] || 'Hindi';
  }

  // Check if language is supported
  isLanguageSupported(langCode: string): boolean {
    return langCode in this.languageMap;
  }

  // Get all supported languages
  getSupportedLanguages(): string[] {
    return Object.keys(this.languageMap);
  }
}

export const vakyanshAPI = new VakyanshAPI();