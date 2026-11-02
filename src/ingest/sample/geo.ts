/** Districts and localities used by the sample dataset, with rough centroids. */
export interface DistrictGeo {
  name: string;
  lat: number;
  lng: number;
  localities: string[];
  weight: number; // relative share of projects
}

export const DISTRICTS: Record<string, DistrictGeo[]> = {
  maharashtra: [
    { name: "Mumbai Suburban", lat: 19.12, lng: 72.88, localities: ["Andheri West", "Goregaon East", "Malad West", "Kandivali East", "Borivali West", "Chembur", "Ghatkopar West", "Mulund West", "Vikhroli", "Jogeshwari East"], weight: 9 },
    { name: "Mumbai City", lat: 18.96, lng: 72.82, localities: ["Lower Parel", "Worli", "Dadar West", "Byculla", "Mahim", "Sion", "Wadala", "Prabhadevi"], weight: 5 },
    { name: "Thane", lat: 19.22, lng: 72.98, localities: ["Ghodbunder Road", "Majiwada", "Kalyan West", "Dombivli East", "Ambernath", "Badlapur", "Mira Road", "Bhayandar East", "Ulhasnagar", "Murbad"], weight: 10 },
    { name: "Pune", lat: 18.52, lng: 73.86, localities: ["Hinjewadi", "Wakad", "Baner", "Kharadi", "Wagholi", "Hadapsar", "Undri", "Ravet", "Moshi", "Tathawade", "Punawale", "Kothrud"], weight: 12 },
    { name: "Raigarh", lat: 18.75, lng: 73.1, localities: ["Panvel", "Kharghar", "Ulwe", "Taloja", "Karjat", "Khopoli", "Kolkhe", "Dronagiri"], weight: 6 },
    { name: "Nagpur", lat: 21.15, lng: 79.09, localities: ["Wardha Road", "Besa", "Manish Nagar", "Hingna", "Koradi Road", "Vihirgaon", "Jamtha", "Mihan"], weight: 5 },
    { name: "Nashik", lat: 20.0, lng: 73.79, localities: ["Gangapur Road", "Pathardi Phata", "Indira Nagar", "Adgaon", "Deolali"], weight: 3 },
    { name: "Palghar", lat: 19.69, lng: 72.77, localities: ["Virar West", "Nalasopara East", "Vasai East", "Boisar", "Naigaon"], weight: 4 },
    { name: "Aurangabad", lat: 19.88, lng: 75.34, localities: ["Beed Bypass", "Cidco N-2", "Garkheda", "Satara Parisar"], weight: 2 },
    { name: "Kolhapur", lat: 16.7, lng: 74.24, localities: ["Rajarampuri", "Tarabai Park", "Kalamba", "Ujalaiwadi"], weight: 2 },
  ],
  gujarat: [
    { name: "Ahmedabad", lat: 23.02, lng: 72.57, localities: ["Bopal", "Shela", "South Bopal", "Gota", "Chandkheda", "Vastral", "Nikol", "Thaltej", "Shilaj", "Vaishnodevi Circle", "Sanand", "Naroda"], weight: 12 },
    { name: "Surat", lat: 21.17, lng: 72.83, localities: ["Vesu", "Pal", "Adajan", "Althan", "Dindoli", "Jahangirpura", "Piplod", "Sarthana"], weight: 8 },
    { name: "Vadodara", lat: 22.31, lng: 73.18, localities: ["Gotri", "Vasna Bhayli", "Sama", "Waghodia Road", "Manjalpur", "Sevasi"], weight: 5 },
    { name: "Rajkot", lat: 22.3, lng: 70.8, localities: ["Kalawad Road", "Raiya Road", "Mavdi", "Nana Mava", "Kothariya"], weight: 4 },
    { name: "Gandhinagar", lat: 23.22, lng: 72.65, localities: ["Kudasan", "Sargasan", "Randesan", "Raysan", "Koba", "Adalaj"], weight: 4 },
    { name: "Bhavnagar", lat: 21.76, lng: 72.15, localities: ["Waghawadi Road", "Kaliyabid", "Subhash Nagar"], weight: 1 },
  ],
  karnataka: [
    { name: "Bengaluru Urban", lat: 12.97, lng: 77.59, localities: ["Whitefield", "Sarjapur Road", "Electronic City", "Yelahanka", "Hebbal", "Kanakapura Road", "Bannerghatta Road", "JP Nagar", "Devanahalli", "Varthur", "Thanisandra", "Rajarajeshwari Nagar", "KR Puram", "Hennur"], weight: 16 },
    { name: "Bengaluru Rural", lat: 13.23, lng: 77.57, localities: ["Devanahalli", "Hoskote", "Nelamangala", "Doddaballapur"], weight: 3 },
    { name: "Mysuru", lat: 12.3, lng: 76.65, localities: ["Vijayanagar", "Hebbal", "Bogadi", "Dattagalli"], weight: 2 },
    { name: "Mangaluru (Dakshina Kannada)", lat: 12.91, lng: 74.86, localities: ["Kadri", "Bejai", "Derebail", "Kottara"], weight: 2 },
    { name: "Hubballi-Dharwad", lat: 15.36, lng: 75.12, localities: ["Gokul Road", "Vidyanagar", "Keshwapur"], weight: 1 },
  ],
  uttarpradesh: [
    { name: "Gautam Buddha Nagar", lat: 28.53, lng: 77.39, localities: ["Sector 150", "Sector 137", "Sector 79", "Greater Noida West", "Yamuna Expressway", "Sector 128", "Sector 107", "Sector 1 Greater Noida West", "Techzone 4", "Sector 16B"], weight: 12 },
    { name: "Ghaziabad", lat: 28.67, lng: 77.42, localities: ["Raj Nagar Extension", "Indirapuram", "Vaishali", "Crossings Republik", "NH-24", "Siddharth Vihar", "Wave City"], weight: 7 },
    { name: "Lucknow", lat: 26.85, lng: 80.95, localities: ["Gomti Nagar Extension", "Sushant Golf City", "Shaheed Path", "Vrindavan Yojana", "Raebareli Road", "Sultanpur Road"], weight: 6 },
    { name: "Agra", lat: 27.18, lng: 78.01, localities: ["Sikandra", "Shastripuram", "Dayalbagh"], weight: 2 },
    { name: "Kanpur Nagar", lat: 26.45, lng: 80.33, localities: ["Kalyanpur", "Swaroop Nagar", "Kidwai Nagar"], weight: 2 },
    { name: "Varanasi", lat: 25.32, lng: 82.99, localities: ["Sarnath", "Sigra", "Lanka"], weight: 1 },
  ],
  westbengal: [
    { name: "Kolkata", lat: 22.57, lng: 88.36, localities: ["EM Bypass", "Tollygunge", "Behala", "Garia", "Joka", "Salt Lake", "Ballygunge", "Dum Dum"], weight: 6 },
    { name: "North 24 Parganas", lat: 22.72, lng: 88.45, localities: ["New Town", "Rajarhat", "Barasat", "Madhyamgram", "Sodepur", "Baranagar"], weight: 8 },
    { name: "South 24 Parganas", lat: 22.45, lng: 88.4, localities: ["Narendrapur", "Sonarpur", "Baruipur", "Joka"], weight: 4 },
    { name: "Howrah", lat: 22.59, lng: 88.31, localities: ["Shibpur", "Santragachi", "Kona Expressway", "Domjur"], weight: 3 },
    { name: "Hooghly", lat: 22.9, lng: 88.39, localities: ["Uttarpara", "Serampore", "Chandannagar"], weight: 2 },
  ],
  kerala: [
    { name: "Ernakulam", lat: 9.98, lng: 76.28, localities: ["Kakkanad", "Edappally", "Marine Drive", "Thrippunithura", "Aluva", "Vyttila", "Kalamassery"], weight: 8 },
    { name: "Thiruvananthapuram", lat: 8.52, lng: 76.94, localities: ["Kazhakkoottam", "Pattom", "Kowdiar", "Sreekaryam", "Technopark"], weight: 4 },
    { name: "Kozhikode", lat: 11.26, lng: 75.78, localities: ["Mavoor Road", "Thondayad", "Chevayur", "Pantheeramkavu"], weight: 3 },
    { name: "Thrissur", lat: 10.53, lng: 76.21, localities: ["Punkunnam", "Ayyanthole", "Kuttanellur"], weight: 2 },
    { name: "Kottayam", lat: 9.59, lng: 76.52, localities: ["Kanjikuzhy", "Nattakom", "Ettumanoor"], weight: 1 },
  ],
  tamilnadu: [
    { name: "Chennai", lat: 13.08, lng: 80.27, localities: ["OMR", "Porur", "Perambur", "Anna Nagar", "Velachery", "Pallikaranai", "Medavakkam", "Madipakkam"], weight: 8 },
    { name: "Chengalpattu", lat: 12.69, lng: 79.98, localities: ["Sholinganallur", "Siruseri", "Kelambakkam", "Tambaram", "Guduvanchery", "Perumbakkam"], weight: 6 },
    { name: "Kancheepuram", lat: 12.83, lng: 79.7, localities: ["Oragadam", "Sriperumbudur", "Poonamallee", "Thiruvallur Road"], weight: 3 },
    { name: "Coimbatore", lat: 11.02, lng: 76.96, localities: ["Saravanampatti", "Vadavalli", "Peelamedu", "Singanallur"], weight: 4 },
    { name: "Madurai", lat: 9.93, lng: 78.12, localities: ["K K Nagar", "Anna Nagar", "Villapuram"], weight: 1 },
  ],
  telangana: [
    { name: "Rangareddy", lat: 17.39, lng: 78.35, localities: ["Gachibowli", "Kokapet", "Narsingi", "Tellapur", "Manikonda", "Shamshabad", "Adibatla", "Puppalaguda"], weight: 9 },
    { name: "Hyderabad", lat: 17.39, lng: 78.49, localities: ["Banjara Hills", "Jubilee Hills", "Kukatpally", "Madhapur", "Uppal", "LB Nagar"], weight: 5 },
    { name: "Medchal-Malkajgiri", lat: 17.63, lng: 78.48, localities: ["Kompally", "Bachupally", "Miyapur", "Nizampet", "Pocharam", "Ghatkesar"], weight: 6 },
    { name: "Sangareddy", lat: 17.62, lng: 78.08, localities: ["Patancheru", "Ameenpur", "Isnapur", "Kollur"], weight: 3 },
  ],
  haryana: [
    { name: "Gurugram", lat: 28.46, lng: 77.03, localities: ["Sector 79", "Sector 89", "Dwarka Expressway", "Golf Course Extension Road", "Sohna Road", "New Gurugram", "Sector 63A", "Sector 37D", "Sector 113"], weight: 10 },
    { name: "Faridabad", lat: 28.41, lng: 77.31, localities: ["Sector 75", "Neharpar", "Sector 86", "Greater Faridabad"], weight: 3 },
    { name: "Panchkula", lat: 30.69, lng: 76.86, localities: ["Sector 20", "Peer Muchalla", "Zirakpur Road"], weight: 2 },
    { name: "Sonipat", lat: 28.99, lng: 77.02, localities: ["Kundli", "Sector 35", "TDI City"], weight: 1 },
  ],
  delhi: [
    { name: "South West Delhi", lat: 28.59, lng: 77.05, localities: ["Dwarka Sector 19B", "Dwarka L Zone", "Najafgarh", "Bijwasan"], weight: 3 },
    { name: "North West Delhi", lat: 28.72, lng: 77.1, localities: ["Rohini Sector 34", "Narela", "Bawana Road"], weight: 2 },
    { name: "South Delhi", lat: 28.52, lng: 77.21, localities: ["Chhatarpur", "Saket", "Greater Kailash"], weight: 1 },
  ],
};
