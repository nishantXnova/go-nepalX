import { useState, useCallback, useMemo, useEffect } from "react";
import { Languages, ArrowRightLeft, Volume2, Copy, Check, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { translateText } from "@/lib/translationService";
import { languages, Language } from "@/lib/languages";
import { useLanguage } from "@/contexts/LanguageContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhraseEntry {
  en: string;
  ne: string;
  hi: string;
  zh: string;
  ja: string;
  ko: string;
  fr: string;
  de: string;
  es: string;
  pronunciation: string; // Romanized Nepali pronunciation
}

interface Language {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

// type LangCode = string;
// Centralized languages are now imported from @/lib/languages

// ---------------------------------------------------------------------------
// Categories & Phrasebook
// ---------------------------------------------------------------------------

const categories = [
  "All",
  "Greetings",
  "Directions",
  "Food & Drink",
  "Shopping",
  "Emergency",
  "Transport",
  "Accommodation",
  "Numbers",
  "Common",
] as const;

type Category = (typeof categories)[number];

const phrasebook: (PhraseEntry & { category: Category })[] = [
  // ---- Greetings ----
  { category: "Greetings", en: "Hello / Greetings", ne: "\u0928\u092e\u0938\u094d\u0924\u0947", hi: "\u0928\u092e\u0938\u094d\u0924\u0947", zh: "\u4f60\u597d", ja: "\u3053\u3093\u306b\u3061\u306f", ko: "\uc548\ub155\ud558\uc138\uc694", fr: "Bonjour", de: "Hallo", es: "Hola", pronunciation: "Namaste" },
  { category: "Greetings", en: "How are you?", ne: "\u0924\u092a\u093e\u0908\u0902\u0932\u093e\u0908 \u0915\u0938\u094d\u0924\u094b \u091b?", hi: "\u0906\u092a \u0915\u0948\u0938\u0947 \u0939\u0948\u0902?", zh: "\u4f60\u597d\u5417\uff1f", ja: "\u304a\u5143\u6c17\u3067\u3059\u304b\uff1f", ko: "\uc798 \uc9c0\ub0b4\uc138\uc694?", fr: "Comment allez-vous ?", de: "Wie geht es Ihnen?", es: "\u00bfC\u00f3mo est\u00e1?", pronunciation: "Tapailai kasto chha?" },
  { category: "Greetings", en: "I am fine", ne: "\u092e \u0920\u0940\u0915 \u091b\u0941", hi: "\u092e\u0948\u0902 \u0920\u0940\u0915 \u0939\u0942\u0901", zh: "\u6211\u5f88\u597d", ja: "\u5143\u6c17\u3067\u3059", ko: "\uc798 \uc9c0\ub0b4\uc694", fr: "Je vais bien", de: "Mir geht es gut", es: "Estoy bien", pronunciation: "Ma thik chhu" },
  { category: "Greetings", en: "Thank you", ne: "\u0927\u0928\u094d\u092f\u0935\u093e\u0926", hi: "\u0927\u0928\u094d\u092f\u0935\u093e\u0926", zh: "\u8c22\u8c22", ja: "\u3042\u308a\u304c\u3068\u3046", ko: "\uac10\uc0ac\ud569\ub2c8\ub2e4", fr: "Merci", de: "Danke", es: "Gracias", pronunciation: "Dhanyabad" },
  { category: "Greetings", en: "You're welcome", ne: "\u0938\u094d\u0935\u093e\u0917\u0924 \u091b", hi: "\u0915\u094b\u0908 \u092c\u093e\u0924 \u0928\u0939\u0940\u0902", zh: "\u4e0d\u5ba2\u6c14", ja: "\u3069\u3046\u3044\u305f\u3057\u307e\u3057\u3066", ko: "\ucc9c\ub9cc\uc5d0\uc694", fr: "De rien", de: "Bitte", es: "De nada", pronunciation: "Swagat chha" },
  { category: "Greetings", en: "Goodbye", ne: "\u0928\u092e\u0938\u094d\u0924\u0947", hi: "\u0928\u092e\u0938\u094d\u0924\u0947", zh: "\u518d\u89c1", ja: "\u3055\u3088\u3046\u306a\u3089", ko: "\uc548\ub155\ud788 \uac00\uc138\uc694", fr: "Au revoir", de: "Auf Wiedersehen", es: "Adi\u00f3s", pronunciation: "Namaste" },
  { category: "Greetings", en: "Please", ne: "\u0915\u0943\u092a\u092f\u093e", hi: "\u0915\u0943\u092a\u092f\u093e", zh: "\u8bf7", ja: "\u304a\u9858\u3044\u3057\u307e\u3059", ko: "\ubd80\ud0c1\ud569\ub2c8\ub2e4", fr: "S'il vous pla\u00eet", de: "Bitte", es: "Por favor", pronunciation: "Kripaya" },
  { category: "Greetings", en: "Excuse me / Sorry", ne: "\u092e\u093e\u092b \u0917\u0930\u094d\u0928\u0941\u0939\u094b\u0938\u094d", hi: "\u092e\u093e\u092b \u0915\u0940\u091c\u093f\u090f", zh: "\u5bf9\u4e0d\u8d77", ja: "\u3059\u307f\u307e\u305b\u3093", ko: "\uc8c4\uc1a1\ud569\ub2c8\ub2e4", fr: "Excusez-moi", de: "Entschuldigung", es: "Perd\u00f3n", pronunciation: "Maaf garnuhos" },

  // ---- Directions ----
  { category: "Directions", en: "Where is ...?", ne: "... \u0915\u0939\u093e\u0901 \u091b?", hi: "... \u0915\u0939\u093e\u0901 \u0939\u0948?", zh: "...\u5728\u54ea\u91cc\uff1f", ja: "...\u306f\u3069\u3053\u3067\u3059\u304b\uff1f", ko: "...\uc774 \uc5b4\ub514\uc5d0 \uc788\uc5b4\uc694?", fr: "O\u00f9 est ... ?", de: "Wo ist ...?", es: "\u00bfD\u00f3nde est\u00e1 ...?", pronunciation: "... kaha chha?" },
  { category: "Directions", en: "Left", ne: "\u092c\u093e\u092f\u093e\u0901", hi: "\u092c\u093e\u092f\u0947\u0902", zh: "\u5de6", ja: "\u5de6", ko: "\uc67c\ucabd", fr: "Gauche", de: "Links", es: "Izquierda", pronunciation: "Bayaa" },
  { category: "Directions", en: "Right", ne: "\u0926\u093e\u092f\u093e\u0901", hi: "\u0926\u093e\u092f\u0947\u0902", zh: "\u53f3", ja: "\u53f3", ko: "\uc624\u0020\ub978\ucabd", fr: "Droite", de: "Rechts", es: "Derecha", pronunciation: "Dayaa" },
  { category: "Directions", en: "Straight ahead", ne: "\u0938\u093f\u0927\u093e", hi: "\u0938\u0940\u0927\u0947", zh: "\u76f4\u8d70", ja: "\u307e\u3063\u3059\u3050", ko: "\uc9c1\uc9c4", fr: "Tout droit", de: "Geradeaus", es: "Recto", pronunciation: "Sidha" },
  { category: "Directions", en: "How far is it?", ne: "\u0915\u0924\u093f \u091f\u093e\u0922\u093e \u091b?", hi: "\u0915\u093f\u0924\u0928\u0940 \u0926\u0942\u0930 \u0939\u0948?", zh: "\u6709\u591a\u8fdc\uff1f", ja: "\u3069\u306e\u304f\u3089\u3044\u9060\u3044\u3067\u3059\u304b\uff1f", ko: "\uc5bc\ub9c8\ub098 \uba40\uc5b4\uc694?", fr: "C'est loin ?", de: "Wie weit ist es?", es: "\u00bfQu\u00e9 tan lejos?", pronunciation: "Kati tadha chha?" },
  { category: "Directions", en: "Near / Close", ne: "\u0928\u091c\u093f\u0915", hi: "\u0928\u091c\u0926\u0940\u0915", zh: "\u8fd1", ja: "\u8fd1\u3044", ko: "\uac00\uae4c\uc6b4", fr: "Pr\u00e8s", de: "Nah", es: "Cerca", pronunciation: "Najik" },
  { category: "Directions", en: "Far", ne: "\u091f\u093e\u0922\u093e", hi: "\u0926\u0942\u0930", zh: "\u8fdc", ja: "\u9060\u3044", ko: "\uba3c", fr: "Loin", de: "Weit", es: "Lejos", pronunciation: "Tadha" },
  { category: "Directions", en: "Map", ne: "\u0928\u0915\u094d\u0938\u093e", hi: "\u0928\u0915\u094d\u0936\u093e", zh: "\u5730\u56fe", ja: "\u5730\u56f3", ko: "\uc9c0\ub3c4", fr: "Carte", de: "Karte", es: "Mapa", pronunciation: "Naksa" },

  // ---- Food & Drink ----
  { category: "Food & Drink", en: "Water", ne: "\u092a\u093e\u0928\u0940", hi: "\u092a\u093e\u0928\u0940", zh: "\u6c34", ja: "\u6c34", ko: "\ubb3c", fr: "Eau", de: "Wasser", es: "Agua", pronunciation: "Paani" },
  { category: "Food & Drink", en: "Food / Meal", ne: "\u0916\u093e\u0928\u093e", hi: "\u0916\u093e\u0928\u093e", zh: "\u996d", ja: "\u98df\u4e8b", ko: "\uc74c\uc2dd", fr: "Repas", de: "Essen", es: "Comida", pronunciation: "Khaana" },
  { category: "Food & Drink", en: "Rice", ne: "\u092d\u093e\u0924", hi: "\u091a\u093e\u0935\u0932", zh: "\u7c73\u996d", ja: "\u3054\u98ef", ko: "\ubc25", fr: "Riz", de: "Reis", es: "Arroz", pronunciation: "Bhaat" },
  { category: "Food & Drink", en: "Tea", ne: "\u091a\u093f\u092f\u093e", hi: "\u091a\u093e\u092f", zh: "\u8336", ja: "\u304a\u8336", ko: "\ucc28", fr: "Th\u00e9", de: "Tee", es: "T\u00e9", pronunciation: "Chiya" },
  { category: "Food & Drink", en: "Delicious", ne: "\u092e\u093f\u0920\u094b", hi: "\u0938\u094d\u0935\u093e\u0926\u093f\u0937\u094d\u091f", zh: "\u597d\u5403", ja: "\u7f8e\u5473\u3057\u3044", ko: "\ub9db\uc788\ub294", fr: "D\u00e9licieux", de: "Lecker", es: "Delicioso", pronunciation: "Mitho" },
  { category: "Food & Drink", en: "I am vegetarian", ne: "\u092e \u0936\u093e\u0915\u093e\u0939\u093e\u0930\u0940 \u0939\u0941\u0901", hi: "\u092e\u0948\u0902 \u0936\u093e\u0915\u093e\u0939\u093e\u0930\u0940 \u0939\u0942\u0901", zh: "\u6211\u662f\u7d20\u98df\u8005", ja: "\u79c1\u306f\u83dc\u98df\u4e3b\u7fa9\u3067\u3059", ko: "\uc800\ub294 \ucc44\uc2dd\uc8fc\uc758\uc790\uc785\ub2c8\ub2e4", fr: "Je suis v\u00e9g\u00e9tarien", de: "Ich bin Vegetarier", es: "Soy vegetariano", pronunciation: "Ma shaakaahaari hun" },
  { category: "Food & Drink", en: "The bill, please", ne: "\u092c\u093f\u0932 \u0926\u093f\u0928\u0941\u0939\u094b\u0938\u094d", hi: "\u092c\u093f\u0932 \u0926\u0940\u091c\u093f\u090f", zh: "\u8bf7\u7ed3\u8d26", ja: "\u304a\u4f1a\u8a08\u304a\u9858\u3044\u3057\u307e\u3059", ko: "\uacc4\uc0b0\uc11c \uc8fc\uc138\uc694", fr: "L'addition, s'il vous pla\u00eet", de: "Die Rechnung, bitte", es: "La cuenta, por favor", pronunciation: "Bill dinuhos" },
  { category: "Food & Drink", en: "Lentil soup (Dal)", ne: "\u0926\u093e\u0932", hi: "\u0926\u093e\u0932", zh: "\u6241\u8c46\u6c64", ja: "\u30c0\u30eb", ko: "\ub2ec", fr: "Soupe de lentilles", de: "Linsensuppe", es: "Sopa de lentejas", pronunciation: "Daal" },

  // ---- Shopping ----
  { category: "Shopping", en: "How much is this?", ne: "\u092f\u094b \u0915\u0924\u093f \u0939\u094b?", hi: "\u092f\u0939 \u0915\u093f\u0924\u0928\u0947 \u0915\u093e \u0939\u0948?", zh: "\u8fd9\u4e2a\u591a\u5c11\u94b1\uff1f", ja: "\u3053\u308c\u306f\u3044\u304f\u3089\u3067\u3059\u304b\uff1f", ko: "\uc774\uac70 \uc5bc\ub9c8\uc608\uc694?", fr: "Combien co\u00fbte ceci ?", de: "Wie viel kostet das?", es: "\u00bfCu\u00e1nto cuesta?", pronunciation: "Yo kati ho?" },
  { category: "Shopping", en: "Too expensive", ne: "\u0927\u0947\u0930\u0948 \u092e\u0939\u0902\u0917\u094b", hi: "\u092c\u0939\u0941\u0924 \u092e\u0939\u0902\u0917\u093e", zh: "\u592a\u8d35\u4e86", ja: "\u9ad8\u3059\u304e\u307e\u3059", ko: "\ub108\ubb34 \ube44\uc2f8\uc694", fr: "Trop cher", de: "Zu teuer", es: "Demasiado caro", pronunciation: "Dherai mahango" },
  { category: "Shopping", en: "Can you reduce the price?", ne: "\u0915\u0947\u0939\u0940 \u0915\u092e \u0917\u0930\u094d\u0928 \u0938\u0915\u094d\u0928\u0941\u0939\u0941\u0928\u094d\u091b?", hi: "\u0915\u094d\u092f\u093e \u0915\u092e \u0939\u094b \u0938\u0915\u0924\u093e \u0939\u0948?", zh: "\u53ef\u4ee5\u4fbf\u5b9c\u70b9\u5417\uff1f", ja: "\u5024\u5f15\u304d\u3067\u304d\u307e\u3059\u304b\uff1f", ko: "\uae4c\uc544\uc8fc\uc2e4 \uc218 \uc788\uc5b4\uc694?", fr: "Pouvez-vous baisser le prix ?", de: "K\u00f6nnen Sie den Preis senken?", es: "\u00bfPuede bajar el precio?", pronunciation: "Kehi kam garna saknuhunchha?" },
  { category: "Shopping", en: "I want to buy", ne: "\u092e \u0915\u093f\u0928\u094d\u0928 \u091a\u093e\u0939\u0928\u094d\u091b\u0941", hi: "\u092e\u0948\u0902 \u0916\u0930\u0940\u0926\u0928\u093e \u091a\u093e\u0939\u0924\u093e \u0939\u0942\u0901", zh: "\u6211\u60f3\u4e70", ja: "\u8cb7\u3044\u305f\u3044\u3067\u3059", ko: "\uc0ac\uace0 \uc2f6\uc5b4\uc694", fr: "Je veux acheter", de: "Ich m\u00f6chte kaufen", es: "Quiero comprar", pronunciation: "Ma kinna chahanchu" },

  // ---- Emergency ----
  { category: "Emergency", en: "Help!", ne: "\u0917\u0941\u0939\u093e\u0930!", hi: "\u092e\u0926\u0926!", zh: "\u6551\u547d\uff01", ja: "\u52a9\u3051\u3066\uff01", ko: "\ub3c4\uc640\uc8fc\uc138\uc694!", fr: "Au secours !", de: "Hilfe!", es: "\u00a1Ayuda!", pronunciation: "Guhar!" },
  { category: "Emergency", en: "I need a doctor", ne: "\u092e\u0932\u093e\u0908 \u0921\u0915\u094d\u091f\u0930 \u091a\u093e\u0939\u093f\u0928\u094d\u091b", hi: "\u092e\u0941\u091d\u0947 \u0921\u0949\u0915\u094d\u091f\u0930 \u091a\u093e\u0939\u093f\u090f", zh: "\u6211\u9700\u8981\u533b\u751f", ja: "\u533b\u8005\u304c\u5fc5\u8981\u3067\u3059", ko: "\uc758\uc0ac\uac00 \ud544\uc694\ud574\uc694", fr: "J'ai besoin d'un m\u00e9decin", de: "Ich brauche einen Arzt", es: "Necesito un m\u00e9dico", pronunciation: "Malai doctor chahinchha" },
  { category: "Emergency", en: "Hospital", ne: "\u0905\u0938\u094d\u092a\u0924\u093e\u0932", hi: "\u0905\u0938\u094d\u092a\u0924\u093e\u0932", zh: "\u533b\u9662", ja: "\u75c5\u9662", ko: "\ubcd1\uc6d0", fr: "H\u00f4pital", de: "Krankenhaus", es: "Hospital", pronunciation: "Aspatal" },
  { category: "Emergency", en: "Police", ne: "\u092a\u094d\u0930\u0939\u0930\u0940", hi: "\u092a\u0941\u0932\u093f\u0938", zh: "\u8b66\u5bdf", ja: "\u8b66\u5bdf", ko: "\uacbd\ucc30", fr: "Police", de: "Polizei", es: "Polic\u00eda", pronunciation: "Prahari" },
  { category: "Emergency", en: "I am lost", ne: "\u092e \u0939\u0930\u093e\u090f\u0901", hi: "\u092e\u0948\u0902 \u0916\u094b \u0917\u092f\u093e \u0939\u0942\u0901", zh: "\u6211\u8ff7\u8def\u4e86", ja: "\u9053\u306b\u8ff7\u3044\u307e\u3057\u305f", ko: "\uae38\uc744 \uc783\uc5c8\uc5b4\uc694", fr: "Je suis perdu", de: "Ich habe mich verirrt", es: "Estoy perdido", pronunciation: "Ma harae" },

  // ---- Transport ----
  { category: "Transport", en: "Bus", ne: "\u092c\u0938", hi: "\u092c\u0938", zh: "\u516c\u5171\u6c7d\u8f66", ja: "\u30d0\u30b9", ko: "\ubc84\uc2a4", fr: "Bus", de: "Bus", es: "Autob\u00fas", pronunciation: "Bus" },
  { category: "Transport", en: "Taxi", ne: "\u091f\u094d\u092f\u093e\u0915\u094d\u0938\u0940", hi: "\u091f\u0948\u0915\u094d\u0938\u0940", zh: "\u51fa\u79df\u8f66", ja: "\u30bf\u30af\u30b7\u30fc", ko: "\ud0dd\uc2dc", fr: "Taxi", de: "Taxi", es: "Taxi", pronunciation: "Taxi" },
  { category: "Transport", en: "Airport", ne: "\u0935\u093f\u092e\u093e\u0928\u0938\u094d\u0925\u0932", hi: "\u0939\u0935\u093e\u0908 \u0905\u0921\u094d\u0921\u093e", zh: "\u673a\u573a", ja: "\u7a7a\u6e2f", ko: "\uacf5\ud56d", fr: "A\u00e9roport", de: "Flughafen", es: "Aeropuerto", pronunciation: "Bimansthal" },
  { category: "Transport", en: "Stop here", ne: "\u092f\u0939\u093e\u0901 \u0930\u094b\u0915\u094d\u0928\u0941\u0939\u094b\u0938\u094d", hi: "\u092f\u0939\u093e\u0901 \u0930\u0941\u0915\u093f\u090f", zh: "\u8bf7\u505c\u8fd9\u91cc", ja: "\u3053\u3053\u3067\u6b62\u307e\u3063\u3066\u304f\u3060\u3055\u3044", ko: "\uc5ec\uae30\uc11c \uc138\uc6cc\uc8fc\uc138\uc694", fr: "Arr\u00eatez-vous ici", de: "Halten Sie hier", es: "Pare aqu\u00ed", pronunciation: "Yahaa roknuhos" },

  // ---- Accommodation ----
  { category: "Accommodation", en: "Hotel", ne: "\u0939\u094b\u091f\u0932", hi: "\u0939\u094b\u091f\u0932", zh: "\u9152\u5e97", ja: "\u30db\u30c6\u30eb", ko: "\ud638\ud154", fr: "H\u00f4tel", de: "Hotel", es: "Hotel", pronunciation: "Hotel" },
  { category: "Accommodation", en: "Room", ne: "\u0915\u094b\u0920\u093e", hi: "\u0915\u092e\u0930\u093e", zh: "\u623f\u95f4", ja: "\u90e8\u5c4b", ko: "\ubc29", fr: "Chambre", de: "Zimmer", es: "Habitaci\u00f3n", pronunciation: "Kotha" },
  { category: "Accommodation", en: "How much per night?", ne: "\u090f\u0915 \u0930\u093e\u0924\u0915\u094b \u0915\u0924\u093f?", hi: "\u090f\u0915 \u0930\u093e\u0924 \u0915\u093e \u0915\u093f\u0924\u0928\u093e?", zh: "\u4e00\u665a\u591a\u5c11\u94b1\uff1f", ja: "\u4e00\u6cca\u3044\u304f\u3089\u3067\u3059\u304b\uff1f", ko: "\ud558\ub8fb\ubc24\uc5d0 \uc5bc\ub9c8\uc608\uc694?", fr: "Combien par nuit ?", de: "Wie viel pro Nacht?", es: "\u00bfCu\u00e1nto por noche?", pronunciation: "Ek raatko kati?" },
  { category: "Accommodation", en: "Check-in / Check-out", ne: "\u091a\u0947\u0915\u0907\u0928 / \u091a\u0947\u0915\u0906\u0909\u091f", hi: "\u091a\u0947\u0915\u0907\u0928 / \u091a\u0947\u0915\u0906\u0909\u091f", zh: "\u529e\u7406\u5165\u4f4f / \u9000\u623f", ja: "\u30c1\u30a7\u30c3\u30af\u30a4\u30f3 / \u30c1\u30a7\u30c3\u30af\u30a2\u30a6\u30c8", ko: "\uccb4\ud06c\uc778 / \uccb4\ud06c\uc544\uc6c3", fr: "Enregistrement / D\u00e9part", de: "Einchecken / Auschecken", es: "Registro / Salida", pronunciation: "Check-in / Check-out" },

  // ---- Numbers ----
  { category: "Numbers", en: "One (1)", ne: "\u090f\u0915", hi: "\u090f\u0915", zh: "\u4e00", ja: "\u4e00", ko: "\ud558\ub098", fr: "Un", de: "Eins", es: "Uno", pronunciation: "Ek" },
  { category: "Numbers", en: "Two (2)", ne: "\u0926\u0941\u0908", hi: "\u0926\u094b", zh: "\u4e8c", ja: "\u4e8c", ko: "\ub458", fr: "Deux", de: "Zwei", es: "Dos", pronunciation: "Dui" },
  { category: "Numbers", en: "Three (3)", ne: "\u0924\u0940\u0928", hi: "\u0924\u0940\u0928", zh: "\u4e09", ja: "\u4e09", ko: "\uc14b", fr: "Trois", de: "Drei", es: "Tres", pronunciation: "Teen" },
  { category: "Numbers", en: "Five (5)", ne: "\u092a\u093e\u0901\u091a", hi: "\u092a\u093e\u0901\u091a", zh: "\u4e94", ja: "\u4e94", ko: "\ub2e4\uc12f", fr: "Cinq", de: "F\u00fcnf", es: "Cinco", pronunciation: "Paach" },
  { category: "Numbers", en: "Ten (10)", ne: "\u0926\u0936", hi: "\u0926\u0938", zh: "\u5341", ja: "\u5341", ko: "\uc5f4", fr: "Dix", de: "Zehn", es: "Diez", pronunciation: "Das" },
  { category: "Numbers", en: "Hundred (100)", ne: "\u0938\u092f", hi: "\u0938\u094c", zh: "\u767e", ja: "\u767e", ko: "\ubc31", fr: "Cent", de: "Hundert", es: "Cien", pronunciation: "Saya" },
  { category: "Numbers", en: "Thousand (1000)", ne: "\u0939\u091c\u093e\u0930", hi: "\u0939\u091c\u093e\u0930", zh: "\u5343", ja: "\u5343", ko: "\ucc9c", fr: "Mille", de: "Tausend", es: "Mil", pronunciation: "Hajaar" },

  // ---- Common ----
  { category: "Common", en: "Yes", ne: "\u0939\u094b", hi: "\u0939\u093e\u0901", zh: "\u662f", ja: "\u306f\u3044", ko: "\ub124", fr: "Oui", de: "Ja", es: "S\u00ed", pronunciation: "Ho" },
  { category: "Common", en: "No", ne: "\u0939\u094b\u0907\u0928", hi: "\u0928\u0939\u0940\u0902", zh: "\u4e0d", ja: "\u3044\u3044\u3048", ko: "\uc544\ub2c8\uc694", fr: "Non", de: "Nein", es: "No", pronunciation: "Hoina" },
  { category: "Common", en: "I don't understand", ne: "\u092e\u0932\u093e\u0908 \u092c\u0941\u091d\u093f\u0928\u0928", hi: "\u092e\u0941\u091d\u0947 \u0938\u092e\u091d \u0928\u0939\u0940\u0902 \u0906\u092f\u093e", zh: "\u6211\u4e0d\u660e\u767d", ja: "\u308f\u304b\u308a\u307e\u305b\u3093", ko: "\uc774\ud574\uac00 \uc548 \ub3fc\uc694", fr: "Je ne comprends pas", de: "Ich verstehe nicht", es: "No entiendo", pronunciation: "Malai bujhinna" },
  { category: "Common", en: "Do you speak English?", ne: "\u0924\u092a\u093e\u0908\u0902 \u0905\u0902\u0917\u094d\u0930\u0947\u091c\u0940 \u092c\u094b\u0932\u094d\u0928\u0941\u0939\u0941\u0928\u094d\u091b?", hi: "\u0915\u094d\u092f\u093e \u0906\u092a \u0905\u0902\u0917\u094d\u0930\u0947\u091c\u0940 \u092c\u094b\u0932\u0924\u0947 \u0939\u0948\u0902?", zh: "\u4f60\u4f1a\u8bf4\u82f1\u8bed\u5417\uff1f", ja: "\u82f1\u8a9e\u3092\u8a71\u305b\u307e\u3059\u304b\uff1f", ko: "\uc601\uc5b4 \ud558\uc138\uc694?", fr: "Parlez-vous anglais ?", de: "Sprechen Sie Englisch?", es: "\u00bfHabla ingl\u00e9s?", pronunciation: "Tapai angreji bolnuhunchha?" },
  { category: "Common", en: "My name is ...", ne: "\u092e\u0947\u0930\u094b \u0928\u093e\u092e ... \u0939\u094b", hi: "\u092e\u0947\u0930\u093e \u0928\u093e\u092e ... \u0939\u0948", zh: "\u6211\u53eb...", ja: "\u79c1\u306e\u540d\u524d\u306f...", ko: "\uc81c \uc774\u0020\ub984\uc740...", fr: "Je m'appelle ...", de: "Mein Name ist ...", es: "Mi nombre es ...", pronunciation: "Mero naam ... ho" },
  { category: "Common", en: "I am from ...", ne: "\u092e ... \u092c\u093e\u091f \u0939\u0941\u0901", hi: "\u092e\u0948\u0902 ... \u0938\u0947 \u0939\u0942\u0901", zh: "\u6211\u6765\u81ea...", ja: "...\u304b\u3089\u6765\u307e\u3057\u305f", ko: "...\uc5d0\uc11c \uc654\uc5b4\uc694", fr: "Je viens de ...", de: "Ich komme aus ...", es: "Soy de ...", pronunciation: "Ma ... bata hun" },
  { category: "Common", en: "Beautiful", ne: "\u0930\u093e\u092e\u094d\u0930\u094b", hi: "\u0938\u0941\u0902\u0926\u0930", zh: "\u7f8e\u4e3d", ja: "\u7f8e\u3057\u3044", ko: "\uc544\ub984\ub2e4\uc6b4", fr: "Beau", de: "Sch\u00f6n", es: "Hermoso", pronunciation: "Ramro" },
  { category: "Common", en: "Good", ne: "\u0930\u093e\u092e\u094d\u0930\u094b", hi: "\u0905\u091a\u094d\u091b\u093e", zh: "\u597d", ja: "\u826f\u3044", ko: "\uc88b\uc740", fr: "Bon", de: "Gut", es: "Bueno", pronunciation: "Ramro" },
  { category: "Common", en: "Nepal is beautiful", ne: "\u0928\u0947\u092a\u093e\u0932 \u0930\u093e\u092e\u094d\u0930\u094b \u091b", hi: "\u0928\u0947\u092a\u093e\u0932 \u0938\u0941\u0902\u0926\u0930 \u0939\u0948", zh: "\u5c3c\u6cca\u5c14\u5f88\u7f8e", ja: "\u30cd\u30d1\u30fc\u30eb\u306f\u7f8e\u3057\u3044\u3067\u3059", ko: "\ub124\ud314\uc740 \uc544\ub984\ub2e4\uc6cc\uc694", fr: "Le N\u00e9pal est beau", de: "Nepal ist sch\u00f6n", es: "Nepal es hermoso", pronunciation: "Nepal ramro chha" },
];

// ---------------------------------------------------------------------------
// Word-level dictionary for free-text translation (EN <-> NE)
// ---------------------------------------------------------------------------

const wordDictionary: Record<string, string> = {
  // English -> Nepali
  hello: "\u0928\u092e\u0938\u094d\u0924\u0947",
  hi: "\u0928\u092e\u0938\u094d\u0924\u0947",
  yes: "\u0939\u094b",
  no: "\u0939\u094b\u0907\u0928",
  please: "\u0915\u0943\u092a\u092f\u093e",
  thanks: "\u0927\u0928\u094d\u092f\u0935\u093e\u0926",
  "thank you": "\u0927\u0928\u094d\u092f\u0935\u093e\u0926",
  sorry: "\u092e\u093e\u092b \u0917\u0930\u094d\u0928\u0941\u0939\u094b\u0938\u094d",
  water: "\u092a\u093e\u0928\u0940",
  food: "\u0916\u093e\u0928\u093e",
  rice: "\u092d\u093e\u0924",
  tea: "\u091a\u093f\u092f\u093e",
  hotel: "\u0939\u094b\u091f\u0932",
  room: "\u0915\u094b\u0920\u093e",
  bus: "\u092c\u0938",
  taxi: "\u091f\u094d\u092f\u093e\u0915\u094d\u0938\u0940",
  airport: "\u0935\u093f\u092e\u093e\u0928\u0938\u094d\u0925\u0932",
  hospital: "\u0905\u0938\u094d\u092a\u0924\u093e\u0932",
  police: "\u092a\u094d\u0930\u0939\u0930\u0940",
  help: "\u0917\u0941\u0939\u093e\u0930",
  good: "\u0930\u093e\u092e\u094d\u0930\u094b",
  bad: "\u0928\u0930\u093e\u092e\u094d\u0930\u094b",
  beautiful: "\u0930\u093e\u092e\u094d\u0930\u094b",
  big: "\u0920\u0942\u0932\u094b",
  small: "\u0938\u093e\u0928\u094b",
  hot: "\u0924\u093e\u0924\u094b",
  cold: "\u091a\u093f\u0938\u094b",
  left: "\u092c\u093e\u092f\u093e\u0901",
  right: "\u0926\u093e\u092f\u093e\u0901",
  near: "\u0928\u091c\u093f\u0915",
  far: "\u091f\u093e\u0922\u093e",
  i: "\u092e",
  you: "\u0924\u092a\u093e\u0908\u0902",
  he: "\u0909",
  she: "\u0909\u0928\u0940",
  we: "\u0939\u093e\u092e\u0940",
  they: "\u0909\u0928\u0940\u0939\u0930\u0942",
  am: "\u0939\u0941\u0901",
  is: "\u091b",
  are: "\u091b\u0928\u094d",
  go: "\u091c\u093e\u0928\u0941",
  come: "\u0906\u0909\u0928\u0941",
  eat: "\u0916\u093e\u0928\u0941",
  drink: "\u092a\u093f\u0909\u0928\u0941",
  sleep: "\u0938\u0941\u0924\u094d\u0928\u0941",
  see: "\u0939\u0947\u0930\u094d\u0928\u0941",
  like: "\u092e\u0928 \u092a\u0930\u094d\u091b",
  love: "\u092e\u093e\u092f\u093e",
  friend: "\u0938\u093e\u0925\u0940",
  family: "\u092a\u0930\u093f\u0935\u093e\u0930",
  mountain: "\u092a\u0939\u093e\u0921",
  river: "\u0928\u0926\u0940",
  temple: "\u092e\u0928\u094d\u0926\u093f\u0930",
  market: "\u092c\u091c\u093e\u0930",
  money: "\u092a\u0948\u0938\u093e",
  expensive: "\u092e\u0939\u0902\u0917\u094b",
  cheap: "\u0938\u0938\u094d\u0924\u094b",
  today: "\u0906\u091c",
  tomorrow: "\u092d\u094b\u0932\u093f",
  now: "\u0905\u0939\u093f\u0932\u0947",
  morning: "\u092c\u093f\u0939\u093e\u0928",
  night: "\u0930\u093e\u0924",
  day: "\u0926\u093f\u0928",
  name: "\u0928\u093e\u092e",
  nepal: "\u0928\u0947\u092a\u093e\u0932",
  kathmandu: "\u0915\u093e\u0920\u092e\u093e\u0921\u094c\u0902",
  pokhara: "\u092a\u094b\u0916\u0930\u093e",
  everest: "\u0938\u0917\u0930\u092e\u093e\u0925\u093e",
  trekking: "\u091f\u094d\u0930\u0947\u0915\u093f\u0919",
  happy: "\u0916\u0941\u0936\u0940",
  welcome: "\u0938\u094d\u0935\u093e\u0917\u0924",
  // Nepali -> English
  "\u0928\u092e\u0938\u094d\u0924\u0947": "hello",
  "\u0939\u094b": "yes",
  "\u0939\u094b\u0907\u0928": "no",
  "\u092a\u093e\u0928\u0940": "water",
  "\u0916\u093e\u0928\u093e": "food",
  "\u092d\u093e\u0924": "rice",
  "\u091a\u093f\u092f\u093e": "tea",
  "\u0927\u0928\u094d\u092f\u0935\u093e\u0926": "thank you",
  "\u0930\u093e\u092e\u094d\u0930\u094b": "good / beautiful",
  "\u0917\u0941\u0939\u093e\u0930": "help",
  "\u0905\u0938\u094d\u092a\u0924\u093e\u0932": "hospital",
  "\u092a\u094d\u0930\u0939\u0930\u0940": "police",
  "\u0928\u0947\u092a\u093e\u0932": "Nepal",
  "\u092a\u0939\u093e\u0921": "mountain",
  "\u0928\u0926\u0940": "river",
  "\u092e\u0928\u094d\u0926\u093f\u0930": "temple",
  "\u092c\u091c\u093e\u0930": "market",
  "\u092a\u0948\u0938\u093e": "money",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LanguageTranslator = () => {
  const { currentLanguage } = useLanguage();
  const [fromLang, setFromLang] = useState<string>("en");
  const [toLang, setToLang] = useState<string>(currentLanguage.code);
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [phraseSearch, setPhraseSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Sync with global language change
  useEffect(() => {
    setToLang(currentLanguage.code);
  }, [currentLanguage]);

  // ---- Translate free text using phrase matching + word dictionary + Google Translate ----
  const translate = useCallback(async () => {
    const text = inputText.trim();
    if (!text) {
      setTranslatedText("");
      setPronunciation("");
      return;
    }

    setIsLoading(true);
    const lowerText = text.toLowerCase();

    try {
      // 1. Use the highly accurate Google Translate service first
      const result = await translateText(text, fromLang, toLang);
      setTranslatedText(result);

      // 2. Try to find a pronunciation in the phrasebook as an enhancement
      const exactMatch = phrasebook.find(
        (p) => (p as any)[fromLang]?.toLowerCase() === lowerText ||
          (p as any)[toLang]?.toLowerCase() === result.toLowerCase()
      );

      if (exactMatch && (toLang === "ne" || fromLang === "ne")) {
        setPronunciation(exactMatch.pronunciation);
      } else {
        setPronunciation("");
      }
    } catch (error) {
      console.error("Translation error:", error);

      // 3. Fallback: Try phrasebook if the API fails
      const exactMatchFallback = phrasebook.find(
        (p) => (p as any)[fromLang]?.toLowerCase() === lowerText
      );

      if (exactMatchFallback) {
        setTranslatedText((exactMatchFallback as any)[toLang] || "");
        setPronunciation(toLang === "ne" || fromLang === "ne" ? exactMatchFallback.pronunciation : "");
        return;
      }

      // 4. Word-by-word fallback (only for en<->ne)
      if (
        (fromLang === "en" && toLang === "ne") ||
        (fromLang === "ne" && toLang === "en")
      ) {
        if (wordDictionary[lowerText]) {
          setTranslatedText(wordDictionary[lowerText]);
          return;
        }

        const words = text.split(/\s+/);
        const translated = words.map((w) => {
          const key = w.toLowerCase();
          return wordDictionary[key] || w;
        });
        setTranslatedText(translated.join(" "));
      } else {
        setTranslatedText(
          `[Connection error] Try searching the phrasebook below for "${text}"`
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [inputText, fromLang, toLang]);

  const handleSwap = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(translatedText !== "" && !translatedText.startsWith("[") ? translatedText : "");
    setTranslatedText("");
    setPronunciation("");
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    }
  };

  const handleSpeak = (text: string, langCode: string) => {
    if (!("speechSynthesis" in window)) {
      toast({
        title: "Speech not supported",
        description: "Your browser does not support text-to-speech.",
        variant: "destructive",
      });
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      en: "en-US",
      ne: "ne-NP",
      hi: "hi-IN",
      zh: "zh-CN",
      ja: "ja-JP",
      ko: "ko-KR",
      fr: "fr-FR",
      de: "de-DE",
      es: "es-ES",
    };
    utterance.lang = langMap[langCode] || "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // ---- Filtered phrasebook ----
  const filteredPhrases = useMemo(() => {
    return phrasebook.filter((p) => {
      const matchesCategory =
        selectedCategory === "All" || p.category === selectedCategory;
      const matchesSearch =
        !phraseSearch ||
        p.en.toLowerCase().includes(phraseSearch.toLowerCase()) ||
        p.ne.includes(phraseSearch) ||
        p.pronunciation.toLowerCase().includes(phraseSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, phraseSearch]);

  const fromLanguage = languages.find((l) => l.code === fromLang);
  const toLanguage = languages.find((l) => l.code === toLang);

  return (
    <section id="translator" className="section-padding bg-gradient-to-b from-background to-secondary/30">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Languages className="h-4 w-4" />
            Free & Open Source
          </span>
          <h2 className="heading-section text-foreground">Language Translator</h2>
          <p className="text-body-large text-muted-foreground mt-3 max-w-2xl mx-auto">
            Travel confidently,Translate without sharing your data
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="translate" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/60 h-12 rounded-xl p-1">
              <TabsTrigger
                value="translate"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-soft"
              >
                Translate Text
              </TabsTrigger>
              <TabsTrigger
                value="phrasebook"
                className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-soft"
              >
                Travel Phrasebook
              </TabsTrigger>
            </TabsList>

            {/* =================== TRANSLATE TAB =================== */}
            <TabsContent value="translate">
              <div className="glass-effect rounded-2xl p-6 md:p-8 shadow-card">
                {/* Language selectors */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      From
                    </label>
                    <Select
                      value={fromLang}
                      onValueChange={(v) => setFromLang(v)}
                    >
                      <SelectTrigger className="h-12 bg-background/50">
                        <SelectValue>
                          <span className="flex items-center gap-2">
                            {fromLanguage?.flag} {fromLanguage?.name}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              {lang.flag} {lang.name}{" "}
                              <span className="text-muted-foreground text-xs">
                                ({lang.nativeName})
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSwap}
                    className="mt-6 rounded-full h-10 w-10 border-primary/30 hover:bg-primary/10 hover:border-primary shrink-0"
                  >
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                  </Button>

                  <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      To
                    </label>
                    <Select
                      value={toLang}
                      onValueChange={(v) => setToLang(v)}
                    >
                      <SelectTrigger className="h-12 bg-background/50">
                        <SelectValue>
                          <span className="flex items-center gap-2">
                            {toLanguage?.flag} {toLanguage?.name}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              {lang.flag} {lang.name}{" "}
                              <span className="text-muted-foreground text-xs">
                                ({lang.nativeName})
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Input */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Enter text
                  </label>
                  <div className="relative">
                    <Textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Type in ${fromLanguage?.name}...`}
                      className="min-h-[100px] text-lg bg-background/50 border-border resize-none pr-12"
                    />
                    {inputText && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSpeak(inputText, fromLang)}
                        className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Translate button */}
                <Button
                  onClick={translate}
                  disabled={isLoading || !inputText.trim()}
                  className="w-full h-12 bg-primary text-background hover:bg-primary/90 text-lg font-semibold rounded-xl shadow-soft hover:shadow-card transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Languages className="h-5 w-5 mr-2" />
                      Translate
                    </>
                  )}
                </Button>

                {/* Result */}
                {translatedText && (
                  <div className="mt-6 p-5 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">
                          {toLanguage?.flag} Translation ({toLanguage?.name})
                        </p>
                        <p className="text-2xl md:text-3xl font-bold text-foreground font-display leading-snug">
                          {translatedText}
                        </p>
                        {pronunciation && (
                          <p className="text-sm text-primary mt-2 italic">
                            Pronunciation: {pronunciation}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSpeak(translatedText, toLang)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(translatedText)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* =================== PHRASEBOOK TAB =================== */}
            <TabsContent value="phrasebook">
              <div className="glass-effect rounded-2xl p-6 md:p-8 shadow-card">
                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={phraseSearch}
                    onChange={(e) => setPhraseSearch(e.target.value)}
                    placeholder="Search phrases in English, Nepali, or pronunciation..."
                    className="pl-10 h-12 bg-background/50"
                  />
                </div>

                {/* Category pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${selectedCategory === cat
                        ? "bg-primary text-background shadow-soft"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Phrase list */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredPhrases.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No phrases found. Try a different search or category.
                    </p>
                  )}
                  {filteredPhrases.map((phrase, idx) => (
                    <div
                      key={idx}
                      className="group p-4 rounded-xl bg-background/60 border border-border/60 hover:border-primary/30 hover:shadow-soft transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {phrase.category}
                            </span>
                          </div>
                          <p className="font-medium text-foreground">
                            {phrase.en}
                          </p>
                          <p className="text-lg font-semibold text-primary mt-1 font-display">
                            {phrase.ne}
                          </p>
                          <p className="text-sm text-muted-foreground italic">
                            {phrase.pronunciation}
                          </p>
                          {toLang !== "ne" && toLang !== "en" && (
                            <p className="text-sm text-accent mt-1">
                              {toLanguage?.flag} {phrase[toLang]}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSpeak(phrase.ne, "ne")}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label={`Listen to ${phrase.ne} in Nepali`}
                          >
                            <Volume2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(phrase.ne)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            aria-label={`Copy ${phrase.ne}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Open source notice */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            100% client-side translation — no data sent to any server. Works
            offline.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LanguageTranslator;
