// Indian States and Union Territories
export const INDIAN_STATES_AND_UTS = [
  // States (28)
  { id: "andhra-pradesh", name: "Andhra Pradesh", type: "state" },
  { id: "arunachal-pradesh", name: "Arunachal Pradesh", type: "state" },
  { id: "assam", name: "Assam", type: "state" },
  { id: "bihar", name: "Bihar", type: "state" },
  { id: "chhattisgarh", name: "Chhattisgarh", type: "state" },
  { id: "goa", name: "Goa", type: "state" },
  { id: "gujarat", name: "Gujarat", type: "state" },
  { id: "haryana", name: "Haryana", type: "state" },
  { id: "himachal-pradesh", name: "Himachal Pradesh", type: "state" },
  { id: "jharkhand", name: "Jharkhand", type: "state" },
  { id: "karnataka", name: "Karnataka", type: "state" },
  { id: "kerala", name: "Kerala", type: "state" },
  { id: "madhya-pradesh", name: "Madhya Pradesh", type: "state" },
  { id: "maharashtra", name: "Maharashtra", type: "state" },
  { id: "manipur", name: "Manipur", type: "state" },
  { id: "meghalaya", name: "Meghalaya", type: "state" },
  { id: "mizoram", name: "Mizoram", type: "state" },
  { id: "nagaland", name: "Nagaland", type: "state" },
  { id: "odisha", name: "Odisha", type: "state" },
  { id: "punjab", name: "Punjab", type: "state" },
  { id: "rajasthan", name: "Rajasthan", type: "state" },
  { id: "sikkim", name: "Sikkim", type: "state" },
  { id: "tamil-nadu", name: "Tamil Nadu", type: "state" },
  { id: "telangana", name: "Telangana", type: "state" },
  { id: "tripura", name: "Tripura", type: "state" },
  { id: "uttar-pradesh", name: "Uttar Pradesh", type: "state" },
  { id: "uttarakhand", name: "Uttarakhand", type: "state" },
  { id: "west-bengal", name: "West Bengal", type: "state" },
  
  // Union Territories (8)
  { id: "andaman-nicobar", name: "Andaman and Nicobar Islands", type: "ut" },
  { id: "chandigarh", name: "Chandigarh", type: "ut" },
  { id: "dadra-nagar-haveli-daman-diu", name: "Dadra and Nagar Haveli and Daman and Diu", type: "ut" },
  { id: "lakshadweep", name: "Lakshadweep", type: "ut" },
  { id: "delhi", name: "Delhi", type: "ut" },
  { id: "puducherry", name: "Puducherry", type: "ut" },
  { id: "ladakh", name: "Ladakh", type: "ut" },
  { id: "jammu-kashmir", name: "Jammu and Kashmir", type: "ut" },
];

// Function to detect state from location data
export const detectStateFromLocation = (locationData: any): string => {
  const stateName = locationData.state?.toLowerCase();
  
  // State mapping from common variations to standard names
  const stateMapping: { [key: string]: string } = {
    "tamil nadu": "Tamil Nadu",
    "tamilnadu": "Tamil Nadu",
    "tn": "Tamil Nadu",
    "andhra pradesh": "Andhra Pradesh",
    "ap": "Andhra Pradesh",
    "karnataka": "Karnataka",
    "ka": "Karnataka",
    "kerala": "Kerala",
    "kl": "Kerala",
    "telangana": "Telangana",
    "ts": "Telangana",
    "maharashtra": "Maharashtra",
    "mh": "Maharashtra",
    "gujarat": "Gujarat",
    "gj": "Gujarat",
    "rajasthan": "Rajasthan",
    "rj": "Rajasthan",
    "madhya pradesh": "Madhya Pradesh",
    "mp": "Madhya Pradesh",
    "uttar pradesh": "Uttar Pradesh",
    "up": "Uttar Pradesh",
    "bihar": "Bihar",
    "br": "Bihar",
    "west bengal": "West Bengal",
    "wb": "West Bengal",
    "odisha": "Odisha",
    "or": "Odisha",
    "jharkhand": "Jharkhand",
    "jh": "Jharkhand",
    "assam": "Assam",
    "as": "Assam",
    "punjab": "Punjab",
    "pb": "Punjab",
    "haryana": "Haryana",
    "hr": "Haryana",
    "himachal pradesh": "Himachal Pradesh",
    "hp": "Himachal Pradesh",
    "uttarakhand": "Uttarakhand",
    "uk": "Uttarakhand",
    "goa": "Goa",
    "ga": "Goa",
    "delhi": "Delhi",
    "dl": "Delhi",
    "chandigarh": "Chandigarh",
    "ch": "Chandigarh",
    "puducherry": "Puducherry",
    "py": "Puducherry",
    "jammu and kashmir": "Jammu and Kashmir",
    "jk": "Jammu and Kashmir",
    "ladakh": "Ladakh",
    "la": "Ladakh",
  };

  if (!stateName) return "Tamil Nadu"; // Default to Tamil Nadu

  // Try direct mapping first
  if (stateMapping[stateName]) {
    return stateMapping[stateName];
  }

  // Try partial matching
  for (const [key, value] of Object.entries(stateMapping)) {
    if (stateName.includes(key) || key.includes(stateName)) {
      return value;
    }
  }

  // Default to Tamil Nadu if no match found
  return "Tamil Nadu";
};