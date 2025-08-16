import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);

export interface VoiceTranscriptionResult {
  text: string;
  detectedLanguage: string;
  confidence: number;
}

export interface JobExtractionResult {
  jobTitle: string;
  jobDescription: string;
  serviceCategory: string;
  urgency: 'low' | 'medium' | 'high';
  budget: {
    min: number;
    max: number;
  } | null;
  location: {
    area?: string;
    district?: string;
    state?: string;
    fullAddress?: string;
  };
  requirements: string[];
  timeframe: string;
  originalLanguage: string;
}

export interface UserInfoExtractionResult {
  firstName: string;
  lastName: string;
  mobile?: string;
  location: {
    area?: string;
    district?: string;
    state?: string;
  };
  confidence: number;
}

// Transcribe audio and detect language
export async function transcribeAudioWithLanguageDetection(
  audioBase64: string,
  mimeType: string = "audio/webm"
): Promise<VoiceTranscriptionResult> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const prompt = `
    Please transcribe this audio and provide:
    1. The transcribed text
    2. The detected language (ISO 639-1 code like 'en', 'hi', 'ta', 'te', etc.)
    3. Confidence score (0-1)
    
    Respond in JSON format:
    {
      "text": "transcribed text here",
      "detectedLanguage": "language_code",
      "confidence": 0.95
    }
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType
        }
      },
      prompt
    ]);

    const response = await result.response;
    const jsonResponse = JSON.parse(response.text());
    
    return {
      text: jsonResponse.text || "",
      detectedLanguage: jsonResponse.detectedLanguage || "en",
      confidence: jsonResponse.confidence || 0.0
    };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}

// Extract job information from transcribed text
export async function extractJobInformation(
  text: string,
  detectedLanguage: string = "en"
): Promise<JobExtractionResult> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
    Extract job posting information from this text: "${text}"
    
    The text is in language: ${detectedLanguage}
    
    Please extract and translate to English:
    1. Job title/service needed
    2. Detailed job description
    3. Service category (plumbing, electrical, painting, cleaning, carpentry, mechanics, appliance repair, security, gardening)
    4. Urgency level (low, medium, high)
    5. Budget range if mentioned (in Indian Rupees)
    6. Location details (area, district, state)
    7. Specific requirements
    8. Time frame/deadline
    
    Respond in this JSON format:
    {
      "jobTitle": "extracted and translated job title",
      "jobDescription": "detailed description in English",
      "serviceCategory": "matching category from list above",
      "urgency": "low/medium/high",
      "budget": {
        "min": 500,
        "max": 2000
      },
      "location": {
        "area": "area name if mentioned",
        "district": "district name if mentioned", 
        "state": "state name if mentioned",
        "fullAddress": "complete address if available"
      },
      "requirements": ["requirement 1", "requirement 2"],
      "timeframe": "when they need it done",
      "originalLanguage": "${detectedLanguage}"
    }
    
    If budget is not mentioned, set budget to null.
    If location details are partial, include only what's available.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Error extracting job information:', error);
    throw new Error('Failed to extract job information');
  }
}

// Extract user information for account creation
export async function extractUserInformation(
  text: string,
  detectedLanguage: string = "en"
): Promise<UserInfoExtractionResult> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
    Extract user information from this text for account creation: "${text}"
    
    The text is in language: ${detectedLanguage}
    
    Look for:
    1. First name and last name
    2. Mobile number (if mentioned, should be 10 digits)
    3. Location: area name, district, state
    4. Any other identifying information
    
    Respond in this JSON format:
    {
      "firstName": "extracted first name",
      "lastName": "extracted last name", 
      "mobile": "10-digit mobile number or null if not found",
      "location": {
        "area": "area name if mentioned",
        "district": "district name if mentioned",
        "state": "state name if mentioned"
      },
      "confidence": 0.85
    }
    
    If information is unclear or not provided, set appropriate fields to null.
    Set confidence based on how clear and complete the information is.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Error extracting user information:', error);
    throw new Error('Failed to extract user information');
  }
}

// Smart location resolution using partial address information
export async function resolveLocationFromPartialAddress(
  partialAddress: string,
  detectedLanguage: string = "en"
): Promise<{area: string; district: string; state: string; confidence: number}> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
    Resolve this partial Indian address to complete location details: "${partialAddress}"
    
    The text is in language: ${detectedLanguage}
    
    Using your knowledge of Indian geography, provide the most likely:
    1. Area/locality name
    2. District name  
    3. State name
    4. Confidence score based on how certain you are
    
    Respond in this JSON format:
    {
      "area": "resolved area/locality name",
      "district": "resolved district name",
      "state": "resolved state name", 
      "confidence": 0.90
    }
    
    If you cannot resolve with reasonable confidence, set confidence below 0.7.
    Use standard Indian place names and spellings.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Error resolving location:', error);
    return {
      area: partialAddress,
      district: "",
      state: "", 
      confidence: 0.1
    };
  }
}

// Detect language from text
export async function detectLanguage(text: string): Promise<{language: string; confidence: number}> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
    Detect the language of this text: "${text}"
    
    Respond with:
    {
      "language": "ISO 639-1 language code (like en, hi, ta, te, bn, ml, kn, gu, mr, pa)",
      "confidence": 0.95
    }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return JSON.parse(response.text());
  } catch (error) {
    console.error('Error detecting language:', error);
    return { language: "en", confidence: 0.5 };
  }
}