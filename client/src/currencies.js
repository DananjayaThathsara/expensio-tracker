export const CURRENCIES = [
  ["USD","United States"],["EUR","Euro area"],["GBP","United Kingdom"],["INR","India"],
  ["AED","United Arab Emirates"],["AFN","Afghanistan"],["ALL","Albania"],["AMD","Armenia"],
  ["ANG","Curaçao & Sint Maarten"],["AOA","Angola"],["ARS","Argentina"],["AUD","Australia"],
  ["AWG","Aruba"],["AZN","Azerbaijan"],["BAM","Bosnia and Herzegovina"],["BBD","Barbados"],
  ["BDT","Bangladesh"],["BGN","Bulgaria"],["BHD","Bahrain"],["BIF","Burundi"],
  ["BMD","Bermuda"],["BND","Brunei"],["BOB","Bolivia"],["BRL","Brazil"],
  ["BSD","Bahamas"],["BTN","Bhutan"],["BWP","Botswana"],["BYN","Belarus"],
  ["BZD","Belize"],["CAD","Canada"],["CDF","Congo (Kinshasa)"],["CHF","Switzerland"],
  ["CLP","Chile"],["CNY","China"],["COP","Colombia"],["CRC","Costa Rica"],
  ["CUP","Cuba"],["CVE","Cabo Verde"],["CZK","Czechia"],["DJF","Djibouti"],
  ["DKK","Denmark"],["DOP","Dominican Republic"],["DZD","Algeria"],["EGP","Egypt"],
  ["ERN","Eritrea"],["ETB","Ethiopia"],["FJD","Fiji"],["FKP","Falkland Islands"],
  ["GEL","Georgia"],["GHS","Ghana"],["GIP","Gibraltar"],["GMD","Gambia"],
  ["GNF","Guinea"],["GTQ","Guatemala"],["GYD","Guyana"],["HKD","Hong Kong"],
  ["HNL","Honduras"],["HTG","Haiti"],["HUF","Hungary"],["IDR","Indonesia"],
  ["ILS","Israel"],["IQD","Iraq"],["IRR","Iran"],["ISK","Iceland"],
  ["JMD","Jamaica"],["JOD","Jordan"],["JPY","Japan"],["KES","Kenya"],
  ["KGS","Kyrgyzstan"],["KHR","Cambodia"],["KMF","Comoros"],["KPW","North Korea"],
  ["KRW","South Korea"],["KWD","Kuwait"],["KYD","Cayman Islands"],["KZT","Kazakhstan"],
  ["LAK","Laos"],["LBP","Lebanon"],["LKR","Sri Lanka"],["LRD","Liberia"],
  ["LSL","Lesotho"],["LYD","Libya"],["MAD","Morocco"],["MDL","Moldova"],
  ["MGA","Madagascar"],["MKD","North Macedonia"],["MMK","Myanmar"],["MNT","Mongolia"],
  ["MOP","Macao"],["MRU","Mauritania"],["MUR","Mauritius"],["MVR","Maldives"],
  ["MWK","Malawi"],["MXN","Mexico"],["MYR","Malaysia"],["MZN","Mozambique"],
  ["NAD","Namibia"],["NGN","Nigeria"],["NIO","Nicaragua"],["NOK","Norway"],
  ["NPR","Nepal"],["NZD","New Zealand"],["OMR","Oman"],["PAB","Panama"],
  ["PEN","Peru"],["PGK","Papua New Guinea"],["PHP","Philippines"],["PKR","Pakistan"],
  ["PLN","Poland"],["PYG","Paraguay"],["QAR","Qatar"],["RON","Romania"],
  ["RSD","Serbia"],["RUB","Russia"],["RWF","Rwanda"],["SAR","Saudi Arabia"],
  ["SBD","Solomon Islands"],["SCR","Seychelles"],["SDG","Sudan"],["SEK","Sweden"],
  ["SGD","Singapore"],["SHP","Saint Helena"],["SLE","Sierra Leone"],["SOS","Somalia"],
  ["SRD","Suriname"],["SSP","South Sudan"],["STN","São Tomé and Príncipe"],["SYP","Syria"],
  ["SZL","Eswatini"],["THB","Thailand"],["TJS","Tajikistan"],["TMT","Turkmenistan"],
  ["TND","Tunisia"],["TOP","Tonga"],["TRY","Türkiye"],["TTD","Trinidad and Tobago"],
  ["TWD","Taiwan"],["TZS","Tanzania"],["UAH","Ukraine"],["UGX","Uganda"],
  ["UYU","Uruguay"],["UZS","Uzbekistan"],["VES","Venezuela"],["VND","Vietnam"],
  ["VUV","Vanuatu"],["WST","Samoa"],["XAF","Central African CFA franc"],["XCD","East Caribbean"],
  ["XOF","West African CFA franc"],["XPF","CFP franc"],["YER","Yemen"],["ZAR","South Africa"],
  ["ZMW","Zambia"],["ZWL","Zimbabwe"]
].map(([code, country]) => ({ code, country }));

const cache = {};
const formatter = code => {
  if (!cache[code]) {
    try {
      cache[code] = new Intl.NumberFormat('en-US', { style: 'currency', currency: code, maximumFractionDigits: 0 });
    } catch {
      cache[code] = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
    }
  }
  return cache[code];
};

export const money = (n, code = 'USD') =>
  (n < 0 ? '−' : '') + formatter(code).format(Math.round(Math.abs(Number(n) || 0)));

export const symbolOf = code => {
  const parts = formatter(code).formatToParts(1);
  return parts.find(p => p.type === 'currency')?.value || code;
};

export const CATEGORIES = [
  { name: 'Food & Dining', tone: 'var(--color-accent-400)', icon: 'ph-fork-knife' },
  { name: 'Groceries', tone: 'var(--color-accent-500)', icon: 'ph-shopping-cart' },
  { name: 'Rent & Bills', tone: 'var(--color-accent-600)', icon: 'ph-house' },
  { name: 'Transport', tone: 'var(--color-accent-2-500)', icon: 'ph-car' },
  { name: 'Shopping', tone: 'var(--color-accent-700)', icon: 'ph-bag' },
  { name: 'Health', tone: 'var(--color-accent-2-600)', icon: 'ph-heartbeat' },
  { name: 'Entertainment', tone: 'var(--color-accent-2-400)', icon: 'ph-film-slate' },
  { name: 'Education', tone: 'var(--color-accent-2-700)', icon: 'ph-book-open' },
  { name: 'Other', tone: 'var(--color-neutral-600)', icon: 'ph-dots-three-circle' }
];
export const METHODS = ['UPI', 'Card', 'Cash', 'Bank transfer'];
export const toneOf = name => (CATEGORIES.find(c => c.name === name) || CATEGORIES[8]).tone;
export const iconOf = name => (CATEGORIES.find(c => c.name === name) || CATEGORIES[8]).icon;
export const OVER = '#d98a8a';
export const WARN = '#d9c08a';

export const monthLabel = key => {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};
export const recentMonths = (count = 12) => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  });
};
export const todayISO = () => new Date().toISOString().slice(0, 10);
