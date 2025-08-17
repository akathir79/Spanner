import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to clean and parse JSON responses from Gemini
function cleanAndParseJSON(responseText: string): any {
  console.log("Raw Gemini response:", responseText);
  
  // Clean up response - remove markdown code blocks
  let cleanedText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
  
  // Try to extract JSON from the response if it contains additional text
  const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanedText = jsonMatch[0];
  }
  
  console.log("Cleaned JSON:", cleanedText);
  
  return JSON.parse(cleanedText);
}

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
    Please transcribe this audio file with multilingual support for Indian languages.
    
    CRITICAL REQUIREMENTS:
    1. If audio is in Tamil, Hindi, Telugu, Bengali, Malayalam, Kannada, Gujarati, Marathi, or Punjabi:
       - First transcribe in the original language
       - Then provide clear English translation
       - Preserve job/service context and technical terms
       - Convert local place names to standard English spellings
    2. Detect the actual spoken language accurately
    3. For job-related content, translate service categories to English
    
    Respond in JSON format:
    {
      "text": "English translation of the transcribed content (or original if already English)",
      "detectedLanguage": "ISO 639-1 code (en, hi, ta, te, bn, ml, kn, gu, mr, pa)",
      "confidence": 0.95
    }
    
    Example: If Tamil audio says "எனக்கு கிச்சனில் பைப் ரிப்பேர் வேண்டும்", 
    respond with text: "I need pipe repair in the kitchen"
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
    let responseText = response.text();
    
    const jsonResponse = cleanAndParseJSON(responseText);
    
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
    CRITICAL: Extract job posting information from this text: "${text}"
    
    The text is in language: ${detectedLanguage}
    
    This is a CLIENT posting a job to HIRE WORKERS for services they need.
    
    MANDATORY TRANSLATION RULES:
    1. ALL jobDescription and requirements MUST be translated to proper English
    2. NEVER keep original language text in jobDescription or requirements
    3. Use clear, professional English for all extracted content
    4. Convert Indian language service terms to standard English (e.g., "பிளம்பர்" → "plumber")
    
    STRICT BUDGET EXTRACTION RULES:
    1. Extract budget ONLY if explicit numbers are mentioned (e.g., "1000 rupees", "500 to 2000", "thousand rupees")
    2. If NO budget numbers mentioned, set budget to null
    3. Be conservative - do not assume or infer budget amounts
    
    LOCATION EXTRACTION RULES:
    1. Extract ONLY if specific place names are mentioned
    2. If no location mentioned, set all location fields to null
    3. Do not assume locations
    
    Extract and translate to English:
    1. Service needed/job title (translate to English)
    2. Detailed job description (translate to clear English)
    3. Service category (plumbing, electrical, painting, cleaning, carpentry, mechanics, appliance_repair, security, gardening)
    4. Urgency level (low, medium, high)
    5. Budget range if explicitly mentioned with numbers
    6. Location details if specifically mentioned
    7. Requirements (translate to English)
    8. Time frame if mentioned
    
    Respond in this JSON format:
    {
      "jobTitle": "Service needed in English (e.g., 'Plumber needed for kitchen repair')",
      "jobDescription": "What work the client needs done - MUST be in English",
      "serviceCategory": "exact match from category list above",
      "urgency": "low/medium/high",
      "budget": null,
      "location": {
        "area": null,
        "district": null, 
        "state": null,
        "fullAddress": null
      },
      "requirements": ["client expectations in English"],
      "timeframe": null,
      "originalLanguage": "${detectedLanguage}"
    }
    
    EXAMPLES:
    - If Tamil: "எனக்கு பிளம்பர் வேண்டும்" → jobDescription: "I need a plumber"
    - If Hindi: "मुझे इलेक्ट्रीशियन चाहिए" → jobDescription: "I need an electrician"
    - Only set budget if numbers mentioned: "1000 रुपये" → budget: {"min": 1000, "max": 1000}
    - Only set location if place mentioned: "Chennai में" → location: {"area": null, "district": "Chennai", "state": null, "fullAddress": null}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return cleanAndParseJSON(response.text());
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
    
    return cleanAndParseJSON(response.text());
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
    
    return cleanAndParseJSON(response.text());
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
    
    return cleanAndParseJSON(response.text());
  } catch (error) {
    console.error('Error detecting language:', error);
    return { language: "en", confidence: 0.5 };
  }
}

interface VoiceJobResult {
  success: boolean;
  message?: string;
  transcription?: string;
  extractedData?: {
    title?: string;
    description?: string;
    serviceCategory?: string;
    location?: string;
    district?: string;
    state?: string;
    budget?: { min: number; max: number };
    urgency?: 'low' | 'medium' | 'high';
    requirements?: string[];
    timeframe?: string;
  };
  confidence?: number;
  processingTime?: number;
}

// Combined function to process voice recordings and extract job details
export async function processVoiceJobPosting(
  audioBase64: string,
  mimeType: string = "audio/webm",
  language: string = "en",
  userId: string
): Promise<VoiceJobResult> {
  const startTime = Date.now();
  
  try {
    // Step 1: Transcribe the audio
    console.log("Processing voice recording for job posting...");
    const transcriptionResult = await transcribeAudioWithLanguageDetection(audioBase64, mimeType);
    
    if (!transcriptionResult.text || transcriptionResult.text.trim().length === 0) {
      return {
        success: false,
        message: "No speech detected in the audio recording. Please try recording again with clear speech.",
        processingTime: Date.now() - startTime
      };
    }

    // Step 2: Extract job details from transcription
    const jobExtractionResult = await extractJobInformation(transcriptionResult.text, transcriptionResult.detectedLanguage);
    
    const processingTime = Date.now() - startTime;
    console.log(`Voice processing completed in ${processingTime}ms`);

    return {
      success: true,
      message: "Voice job posting processed successfully",
      transcription: transcriptionResult.text,
      extractedData: {
        title: jobExtractionResult.jobTitle,
        description: jobExtractionResult.jobDescription,
        serviceCategory: jobExtractionResult.serviceCategory,
        location: jobExtractionResult.location.fullAddress || `${jobExtractionResult.location.area || ''}, ${jobExtractionResult.location.district || ''}, ${jobExtractionResult.location.state || ''}`.replace(/^,\s*|,\s*$/g, ''),
        district: jobExtractionResult.location.district,
        state: jobExtractionResult.location.state,
        budget: jobExtractionResult.budget || { min: 1000, max: 5000 },
        urgency: jobExtractionResult.urgency,
        requirements: jobExtractionResult.requirements,
        timeframe: jobExtractionResult.timeframe
      },
      confidence: transcriptionResult.confidence,
      processingTime
    };

  } catch (error: any) {
    console.error("Error processing voice job posting:", error);
    
    return {
      success: false,
      message: `Voice processing failed: ${error.message || 'Unknown error occurred'}`,
      processingTime: Date.now() - startTime
    };
  }
}