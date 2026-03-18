require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const WILAYAS = [
  { code: 1, name_ar: "أدرار", name_en: "Adrar" },
  { code: 2, name_ar: "الشلف", name_en: "Chlef" },
  { code: 3, name_ar: "الأغواط", name_en: "Laghouat" },
  { code: 4, name_ar: "أم البواقي", name_en: "Oum El Bouaghi" },
  { code: 5, name_ar: "باتنة", name_en: "Batna" },
  { code: 6, name_ar: "بجاية", name_en: "Bejaia" },
  { code: 7, name_ar: "بسكرة", name_en: "Biskra" },
  { code: 8, name_ar: "بشار", name_en: "Bechar" },
  { code: 9, name_ar: "البليدة", name_en: "Blida" },
  { code: 10, name_ar: "البويرة", name_en: "Bouira" },
  { code: 11, name_ar: "تمنراست", name_en: "Tamanrasset" },
  { code: 12, name_ar: "تبسة", name_en: "Tebessa" },
  { code: 13, name_ar: "تلمسان", name_en: "Tlemcen" },
  { code: 14, name_ar: "تيارت", name_en: "Tiaret" },
  { code: 15, name_ar: "تيزي وزو", name_en: "Tizi Ouzou" },
  { code: 16, name_ar: "الجزائر", name_en: "Alger" },
  { code: 17, name_ar: "الجلفة", name_en: "Djelfa" },
  { code: 18, name_ar: "جيجل", name_en: "Jijel" },
  { code: 19, name_ar: "سطيف", name_en: "Setif" },
  { code: 20, name_ar: "سعيدة", name_en: "Saida" },
  { code: 21, name_ar: "سكيكدة", name_en: "Skikda" },
  { code: 22, name_ar: "سيدي بلعباس", name_en: "Sidi Bel Abbes" },
  { code: 23, name_ar: "عنابة", name_en: "Annaba" },
  { code: 24, name_ar: "قالمة", name_en: "Guelma" },
  { code: 25, name_ar: "قسنطينة", name_en: "Constantine" },
  { code: 26, name_ar: "المدية", name_en: "Medea" },
  { code: 27, name_ar: "مستغانم", name_en: "Mostaganem" },
  { code: 28, name_ar: "المسيلة", name_en: "M'Sila" },
  { code: 29, name_ar: "معسكر", name_en: "Mascara" },
  { code: 30, name_ar: "ورقلة", name_en: "Ouargla" },
  { code: 31, name_ar: "وهران", name_en: "Oran" },
  { code: 32, name_ar: "البيض", name_en: "El Bayadh" },
  { code: 33, name_ar: "إليزي", name_en: "Illizi" },
  { code: 34, name_ar: "برج بوعريريج", name_en: "Bordj Bou Arreridj" },
  { code: 35, name_ar: "بومرداس", name_en: "Boumerdes" },
  { code: 36, name_ar: "الطارف", name_en: "El Tarf" },
  { code: 37, name_ar: "تندوف", name_en: "Tindouf" },
  { code: 38, name_ar: "تيسمسيلت", name_en: "Tissemsilt" },
  { code: 39, name_ar: "الوادي", name_en: "El Oued" },
  { code: 40, name_ar: "خنشلة", name_en: "Khenchela" },
  { code: 41, name_ar: "سوق أهراس", name_en: "Souk Ahras" },
  { code: 42, name_ar: "تيبازة", name_en: "Tipaza" },
  { code: 43, name_ar: "ميلة", name_en: "Mila" },
  { code: 44, name_ar: "عين الدفلى", name_en: "Ain Defla" },
  { code: 45, name_ar: "النعامة", name_en: "Naama" },
  { code: 46, name_ar: "عين تيموشنت", name_en: "Ain Temouchent" },
  { code: 47, name_ar: "غرداية", name_en: "Ghardaia" },
  { code: 48, name_ar: "غليزان", name_en: "Relizane" },
  { code: 49, name_ar: "تيميمون", name_en: "Timimoun" },
  { code: 50, name_ar: "برج باجي مختار", name_en: "Bordj Badji Mokhtar" },
  { code: 51, name_ar: "أولاد جلال", name_en: "Ouled Djellal" },
  { code: 52, name_ar: "بني عباس", name_en: "Beni Abbes" },
  { code: 53, name_ar: "عين صالح", name_en: "Ain Salah" },
  { code: 54, name_ar: "عين قزام", name_en: "Ain Guezzam" },
  { code: 55, name_ar: "توقرت", name_en: "Touggourt" },
  { code: 56, name_ar: "جانت", name_en: "Djanet" },
  { code: 57, name_ar: "المغير", name_en: "El M'Ghair" },
  { code: 58, name_ar: "المنيعة", name_en: "El Meniaa" }
];

async function seed() {
  const fees = WILAYAS.map(w => ({
    wilaya_name: w.name_ar,
    wilaya_code: w.code,
    home_fee: 500,
    desk_fee: 400,
  }));

  // Set Algiers fee explicitly
  const algiers = fees.find(f => f.wilaya_code === 16);
  if (algiers) {
    algiers.desk_fee = 200;
  }

  const { data, error } = await supabase.from('shipping_fees').upsert(fees, { onConflict: 'wilaya_name' });
  if (error) console.error('Error seeding data:', error);
  else console.log('58 Wilayas shipping fees seeded successfully!');
}

seed();
