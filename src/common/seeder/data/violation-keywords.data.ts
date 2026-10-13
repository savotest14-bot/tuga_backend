import { ViolationCategory } from '@prisma/client';

export interface ViolationKeywordItem {
  keyword: string;
  category: ViolationCategory;
  severity: number;
}

export const CONTENT_MODERATION_KEYWORDS: ViolationKeywordItem[] = [
  {
    keyword: "$hit",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "4rschloch",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "5hit",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "a$$hole",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "a55hole",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "abwertende bezeichnung f\u00fcr chinesen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "abwertendes schimpfwort f\u00fcr lesben",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "abwertendes schimpfwort f\u00fcr wei\u00dfe",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "acaba com a sua vida",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "acaba com a tua vida",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "acaba con tu vida",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "acheter des drogues",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "acid",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "acide",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "acompa\u00f1ante",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "acompa\u00f1antes",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "ameaca",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ameacar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "amea\u00e7a",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "amea\u00e7ar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "amenaza",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "amenazante",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "amenazar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "anilingus",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "antisemitisches schimpfwort",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "anulingus",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "apu\u00f1alado",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "apu\u00f1alarte",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "arabe de merda",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "arschloch",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "arschl\u00f6cher",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "asesinarte",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "asesino",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "asshole",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "assholes",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "attard\u00e9 (insulte validiste)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "auf dich schie\u00dfen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "b!tch",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "b1tch",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "b1te",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "bais\u00e9",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "bastard",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "bastardo",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "beaner",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "beat you up",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "beat your ass",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bedrohen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bedrohlich",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "beende dein leben",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "behindert (ableistisch beleidigend)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "behinderter (ableistisch beleidigend)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "beleidigender begriff f\u00fcr trans frauen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bens roubados",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bienes robados",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "biens vol\u00e9s",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bitch",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "bitches",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "bitching",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "bite",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "bites",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "blanchiment d\u2019argent",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "blanchir de l\u2019argent",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "blanquear dinero",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "blanqueo de capitales",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "blow job",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "blow you up",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "blowjob",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "bollera (insulto lesb\u00f3fobo)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bomb you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bomb your house",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bombardear tu casa",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bombardearte",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bombarder ta maison",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "boquete",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "branlette",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "branleur",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "branleurs",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "break your neck",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bring dich um",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "br\u00fbler ta maison",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "br\u00fbler ton domicile",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "bullshit",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "burn your home",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "burn your house",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "buy drugs",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "b\u00e2tard",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "c**",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "c**o",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "c**t",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "c*n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "c*nt",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "c*r*l*h*",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "c*\u00f1o",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "c0ck",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "c0na",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "c0nnard",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cabr4o",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cabr@o",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cabra",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cabrao",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cabras",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cabroes",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cabrones",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cabr\u00e3o",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cabr\u00f3n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cabr\u00f5es",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cagando",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "caliente",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cannabis",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "can\u00e1bis",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "capullo",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "capullos",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "caralho",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "caralhos",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cerdo cristiano",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cerdo islamista",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cerdo jud\u00edo",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cerdo musulm\u00e1n",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "champignons hallucinog\u00e8nes",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "champis",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "chatte",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "chattes",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "chier",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "chinetoque",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "chink",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "chino de forma despectiva",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "christian pig",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "christliches schwein",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cigana de merda",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cigano de merda",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cocaina",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cocaine",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "coca\u00edna",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "coca\u00edna crack",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "coca\u00efne",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cock",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cocks",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cogumelos m\u00e1gicos",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "coke",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "comprar droga",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "comprar drogas",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "con",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cona",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "conas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "connard",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "connards",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "conneries",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cons",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "contrefa\u00e7on",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "coon",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "correrse",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "corri\u00e9ndose",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "counterfeit",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "co\u00f1o",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "co\u00f1os",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "crack",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "crack cocaine",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "crack-kokain",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cracker",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cr\u00e8ve",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cr\u00e8ve, salope",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "cu",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cum",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cumming",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cunt",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cunts",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "cus",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "c\u00fa",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "d1ck",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "darte una paliza",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dealer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dealer de drogue",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "deber\u00edas morir",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dein haus anz\u00fcnden",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dein haus bombardieren",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dein zuhause anz\u00fcnden",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "desnudez",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "desnudo",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "desnudos",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "destrozarte la cara",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dich bombardieren",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dich ermorden",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dich erstechen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dich in die luft sprengen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dich t\u00f6ten",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dich vergewaltigen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dich verpr\u00fcgeln",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dick",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "dickhead",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "dickheads",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "dicks",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "die bitch",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "diebesgut",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dir das genick brechen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dir das gesicht einschlagen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dir den arsch versohlen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dir wehtun",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dispararte",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dispar\u00e1ndote",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "droga",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "drogas",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "drogen kaufen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "drogen verkaufen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "drogendealer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "drohung",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "drop dead",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "drug dealer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "du solltest sterben",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "dyke",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ecstasy",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "en train de jouir",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "en train de se masturber",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "en train de te tirer dessus",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "encul3",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "encul\u00e9",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "encul\u00e9s",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "end your life",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "erecciones",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "erecci\u00f3n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "erection",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "erections",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "erektion",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "erektionen",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "escort",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "escorts",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "espero que morra",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "espero que morras",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "espero que mueras",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "espero que tengas c\u00e1ncer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "excit\u00e9",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f i c k e n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f u c k",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f***",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f**k",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f**ken",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f**tze",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f*ck",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f*cken",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f*d*a",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f*otze",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f-i-c-k-e-n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f-u-c-k",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f.i.c.k.e.n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f.u.c.k",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f0d3r",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f0d4",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fag",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "faggot",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "fake passport",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "falsificacao",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "falsificaci\u00f3n",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "falsificado",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "falsifica\u00e7\u00e3o",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "falsifi\u00e9",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "faux passeport",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "fck",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fcking",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "felaci\u00f3n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fellation",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fentanilo",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "fentanyl",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ferme-la",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "ficken",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fickend",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "ficker",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "filha da puta",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "filho da puta",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "filhos da puta",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "foda",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "foda se",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "foda-se",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fodas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fodasse",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fode te",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fode-te",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "foder",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "foderam",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "forged",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "fotze",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fotzen",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fuck",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fucked",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fucker",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fuckers",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fucking",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fudida",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fudidas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fudido",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fudidos",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fufa",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "fufas",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "fuk",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "fu\u0441k",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "f\u00e4lschung",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "g1lipollas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "gefickt",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "gef\u00e4lscht",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "gef\u00e4lschter pass",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "geh dich umbringen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "geh sterben",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "geil",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "geld waschen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "geldw\u00e4sche",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "gestohlenes eigentum",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "gilipollas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "gitan (souvent p\u00e9joratif)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "gitano (a menudo despectivo)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "go die",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "go kill yourself",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "gook",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "gouine (insulte lesbophobe)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "gras",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "gypsy",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "h0re",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "h1jo de puta",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "hacerse una paja",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "hacerte da\u00f1o",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "hacerte explotar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "hach\u00eds",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "halt die klappe",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "hand job",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "handjob",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "haschich",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "haschisch",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "hash",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "hashish",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "haxixe",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "hdp",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "he-she",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "herbe",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "heroin",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "heroina",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "hero\u00edna",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "hierba",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "hijo de puta",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "hijos de puta",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "homo",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "honky",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "hooker",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "hookers",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "hope you die",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "hope you get cancer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "horny",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "horseshit",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "hure",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "huren",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "hurt you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "h\u00e9ro\u00efne",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "i will kill you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "i will rape you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "i'll kill you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "i'm going to kill you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ich hoffe, du bekommst krebs",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ich hoffe, du stirbst",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ich werde dich t\u00f6ten",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ich werde dich vergewaltigen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ill kill you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "im going to kill you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "imigrante de merda",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulte antis\u00e9mite",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulte contre les personnes trans",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulte p\u00e9jorative contre les blancs",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulte raciste contre les arabes",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulte raciste contre les asiatiques",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulte raciste contre les latino-am\u00e9ricains",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulte raciste contre les mexicains",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulte raciste contre les pakistanais",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulte raciste contre les personnes noires",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulte raciste contre les personnes portant un turban",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulto antisemita",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulto contra personas trans",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulto despectivo contra blancos",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulto racista contra asi\u00e1ticos",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulto racista contra latinoamericanos",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulto racista contra mexicanos",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulto racista contra pakistan\u00edes",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulto racista contra personas con turbante",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulto racista contra personas negras",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "insulto racista contra \u00e1rabes",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "islamist pig",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "islamistisches schwein",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "j o d e r",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "j***",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "j**er",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "j*der",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "j-o-d-e-r",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "j.o.d.e.r",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "jdiendo",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "jdr",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "je vais te tuer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "je vais te violer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "jerk off",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "jerkoff",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "jew pig",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "jizz",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "joder",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "jodido",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "jouir",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "judeu de merda",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "judia de merda",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "j\u00fcdisches schwein",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "j\u2019esp\u00e8re que tu aies un cancer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "j\u2019esp\u00e8re que tu meures",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ketamin",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ketamina",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ketamine",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "kike",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "kill you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "kill yourself",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "kokain",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "koks",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "kommen",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "kys",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "k\u00e9tamine",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "launder money",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "lavagem de dinheiro",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "lefa",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "lsd",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "m*r*d*",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "m*rda",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "m0therfucker",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "m13rda",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "m3rda",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "m3rde",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "magic mushrooms",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "maricas",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "maric\u00f3n (insulto hom\u00f3fobo)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "marihuana",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "marijuana",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "masturbacao",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "masturbaci\u00f3n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "masturbarse",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "masturbate",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "masturbating",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "masturbation",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "masturba\u00e7\u00e3o",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "masturbieren",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "masturbierend",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "masturb\u00e1ndose",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "mata te",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "mata-te",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "matarte",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "mato te",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "mato-te",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "mdma",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "meckern",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "menace",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "menacer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "mena\u00e7ant",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "mercadoria roubada",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "merda",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "merdas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "merde",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "metanfetamina",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "meth",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "methamphetamin",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "methamphetamine",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "mets fin \u00e0 tes jours",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "meurtrier",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "mierda",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "money laundering",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "morre",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "motherfucker",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "motherfuckers",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "mthrfkr",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "muculmano de merda",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "murder you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "murderer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "muschi",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "muschis",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "muslim pig",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "muslimisches schwein",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "mu\u00e7ulmano de merda",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "mu\u00e9rete",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "mu\u00e9rete, zorra",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "m\u00e9thamph\u00e9tamine",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "m\u00f6rder",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "nackt",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "nacktbilder",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "nacktheit",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "naked",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "negrata",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "niedergestochen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "nigga",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "nigger",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "nu",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "nua",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "nuas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "nude",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "nudes",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "nudity",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "nudit\u00e9",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "nus",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "n\u00e8gre",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "opioide",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "opioides",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "opioids",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "opio\u00efdes",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "orgasm",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "orgasme",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "orgasmen",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "orgasmes",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "orgasmo",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "orgasmos",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "orgasms",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "orgasmus",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p u t a i n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p!rra",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p***",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p**ain",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p*t*",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p*t*in",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p*ta",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p-u-t-a-i-n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p.u.t.a.i.n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p0lla",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p0rn",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p0rno",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p1ch4",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p1la",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p3rra",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "paja manual",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pajero",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "paki",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "paneleiro",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "paneleiros",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "partir te a cara",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "partir-te a cara",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "parto te a cara",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "parto-te a cara",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "pasaporte falso",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "pau",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "penis",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "perra",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "perras",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pferdemist",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "picha",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pichas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pila",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pilas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "poignard\u00e9",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "polla",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pollas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "porc chr\u00e9tien",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "porc islamiste",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "porc juif",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "porc musulman",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "porn",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "porno",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pornografia",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pornografie",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pornografisch",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pornograf\u00eda",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pornographic",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pornographie",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pornographique",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pornography",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pornogr\u00e1fico",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pornos",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "porra",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "porras",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "preta de merda",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "preto de merda",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "propiedad robada",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "prostituci\u00f3n",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "prostituierte",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "prostituta",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "prostitutas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "prostitute",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "prostitution",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "prostitu\u00e9e",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "prostitu\u00e9es",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "ptain",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "ptn",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "punheta",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "punhetas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pussies",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pussy",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "put3",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "put4",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "puta",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "puta que pariu",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "putain",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "putain de",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "putas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "pute",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "putes",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "puto",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "putos",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "p\u00e9d\u00e9 (insulte homophobe)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "p\u00e9nis",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "qu3ue",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "queer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "queer (je nach kontext beleidigung oder selbstbezeichnung)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "queer (seg\u00fan el contexto, insulto o t\u00e9rmino reivindicado)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "queer (selon le contexte, insulte ou terme revendiqu\u00e9)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "queimar a tua casa",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "quejarse",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "quemar tu casa",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "quemar tu hogar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "queue",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "queues",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "qu\u00e9 co\u00f1o",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "rabo",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "raghead",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rape",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rape you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rapist",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rassistisches schimpfwort gegen araber",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rassistisches schimpfwort gegen asiaten",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rassistisches schimpfwort gegen latinos",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rassistisches schimpfwort gegen mexikaner",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rassistisches schimpfwort gegen pakistaner",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rassistisches schimpfwort gegen schwarze",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rassistisches schimpfwort gegen turbantr\u00e4ger",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rebentar contigo",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "retard",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "retarded",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "retrasado (insulto capacitista)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "rim job",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "rimjob",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "romperte el cuello",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "r\u00e2ler",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "s!lope",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "s4lope",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "salope",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "salopes",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "sandnigger",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "sch31\u00dfe",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "schei\u00dfe",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "schei\u00dfen",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "schimpfwort gegen trans personen",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "schl!mpe",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "schl4mpe",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "schlampe",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "schlampen",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "schw4nz",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "schwachkopf",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "schwachk\u00f6pfe",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "schwanz",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "schwuchtel",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "schwuchtel (homophobes schimpfwort)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "schw\u00e4nze",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "screw off",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "se branler",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "se masturber",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "sell drugs",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "selling drugs",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "semen",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "setas m\u00e1gicas",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "sex",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "sexe",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "sexo",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "sexual",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "sexuel",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "sexuell",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "sexy",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "sh1t",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "shemale",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "shit",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "shitting",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "shoot you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "shooting you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "shrooms",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "slut",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "sluts",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "smash your face",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "sperma",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "sperme",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "spic",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "stab you",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "stabbed",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "stfu",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "stirb",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "stirb, schlampe",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "stolen goods",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "stolen property",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "suicide-toi",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "suic\u00eddate",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "s\u00e4ure",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te bombarder",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te botter le cul",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te briser le cou",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te faire du mal",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te faire exploser",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te fracasser le visage",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te matar\u00e9",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te poignarder",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te tabasser",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te tirer dessus",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te tuer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te violar\u00e9",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "te violer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "terme offensant pour les femmes trans",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "tesao",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "tes\u00e3o",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "threat",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "threaten",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "threatening",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "tonter\u00edas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "tr0u du cul",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "traficante",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "traficante de drogas",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "tranny",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "trottel",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "tu devrais mourir",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "twat",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "twats",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "t\u00e9rmino ofensivo para mujeres trans",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "t\u00eate de n\u0153ud",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "t\u00eates de n\u0153ud",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "va mourir",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "va te faire voir",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "va te suicider",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vadia",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "vadias",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "vagina",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "vaginas",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "vai morrer",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vai para o caralho",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "vai pro caralho",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "vai te foder",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "vai te matar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vai-te foder",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "vai-te matar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ve a suicidarte",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vender droga",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vender drogas",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vendiendo drogas",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vendre des drogues",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vente de drogues",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vergewaltiger",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vergewaltigung",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "verpiss dich",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "vete a la mierda",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "vete a morir",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "viol",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "violacao",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "violaci\u00f3n",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "violador",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "violarte",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "viola\u00e7\u00e3o",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "violeur",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vou te apanhar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vou te bater",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vou te matar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vou te violar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vou-te apanhar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vou-te bater",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vou-te matar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "vou-te violar",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "voy a matarte",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "wanker",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "wankers",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "wanking",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "was zum fick",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "weed",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "wetback",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "wh0re",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "whore",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "whores",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "wichsen",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "wichser",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "wtf",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "you should die",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "zauberpilze",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "zigeuner (oft abwertend)",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "\u00e1cido",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "\u00e1rabe de merda",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "\u00e9rection",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "\u00e9rections",
    category: ViolationCategory.ABUSE,
    severity: 2,
  },
  {
    keyword: "\u00e9xtasis",
    category: ViolationCategory.ABUSE,
    severity: 3,
  },
  {
    keyword: "ass\u00e9dio",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "bestechung",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "blackmail",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "bribe",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "bribery",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "burla",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "burl\u00e3o",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "chantage",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "chantagem",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "chantaje",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "comisi\u00f3n ilegal",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "commission occulte",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "corruption",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "cvv",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "erpressung",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "extorsion",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "extorsi\u00f3n",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "extortion",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "fraude",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "kickback",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "pot-de-vin",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "roubado",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "sobornar",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "soborno",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "suborno",
    category: ViolationCategory.FRAUD,
    severity: 2,
  },
  {
    keyword: "abruti",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "abrutis",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "arsehole",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "arseholes",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "asswipe",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "asswipes",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "bilder schicken",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "burra",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "burro",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "burros",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "cabeza de mierda",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "cabezas de mierda",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "cala te",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "cala-te",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "coucher ensemble",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "cretin",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "cretino",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "cretinos",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "cretins",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "cr\u00e9tin",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "cr\u00e9tins",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "c\u00e1llate",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "douchebag",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "douchebags",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "dumbass",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "dumbasses",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "dumm",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "dummheit",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "dummkopf",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "dummk\u00f6pfe",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "d\u00e9gage",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "encontro para sexo",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "encuentro sexual",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "enlace porno",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "envoie des nudes",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "envoie des photos",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "envoie-moi des nudes",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "envoie-moi des photos",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "env\u00eda desnudos",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "env\u00eda fotos",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "env\u00edame desnudos",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "env\u00edame fotos",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "erb\u00e4rmlich",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "escoria",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "estupida",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "estupidez",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "estupido",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "est\u00fapida",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "est\u00fapido",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "est\u00fapido de merda",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "fansly",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "fick dich",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "fils de pute",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "foto desnuda",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "fotos desnudas",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "get lost",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "halt den mund",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "hau ab",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "hook up",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "hook-up",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "hookup",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "hurensohn",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "idiot",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "idiota",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "idiota de merda",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "idiotas",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "idioten",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "idiots",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "imbecil",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "imbecile",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "imbeciles",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "imbecis",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "imb\u00e9cil",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "imb\u00e9cile",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "imb\u00e9ciles",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "imb\u00e9cis",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "inuteis",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "inutil",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "in\u00fateis",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "in\u00fatil",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "kretin",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "kretins",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "lien porno",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "link de pornografia",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "loser",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "losers",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "l\u00e1rgate",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "manda fotos",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "manda fotos nua",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "manda fotos nuas",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "manda nudes",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "meet for sex",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "mistkerl",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "mistkerle",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "moron",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "morons",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "nacktbilder schicken",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "nacktfoto",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "naked pics",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "nude pic",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "onlyfans",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "ordure",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "ordures",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "otaria",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "otario",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "otarios",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "ot\u00e1ria",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "ot\u00e1rio",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "ot\u00e1rios",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "parva",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "parvas",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "parvo",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "parvos",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "patetico",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "pathetic",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "path\u00e9tique",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "pat\u00e9tico",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "pedazo de mierda",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "perdant",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "perdants",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "perdedor",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "perdedores",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "photo nue",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "photos nues",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "piece of shit",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "plan cul",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "porn link",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "pornolink",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "prick",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "pricks",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "que te jodan",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "quedar para sexo",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sac \u00e0 merde",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "schei\u00dfkopf",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "schei\u00dfk\u00f6pfe",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "schick mir bilder",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "schick mir nacktbilder",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "screw you",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "scumbag",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "scumbags",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "se rencontrer pour du sexe",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "send me nudes",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "send me pics",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "send nudes",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "send pics",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sex for money",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sex gegen geld",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sex treffen",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sex work",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sexarbeit",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sexe contre argent",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sexo por dinero",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sexo por dinheiro",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sext",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sextear",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sexting",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "shithead",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "shitheads",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "shut up",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sich zum sex treffen",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "son of a bitch",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "stupid",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "stupide",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "stupidity",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "stupidit\u00e9",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "st\u00fcck schei\u00dfe",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sugar baby",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sugar daddy",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "sugar mommy",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "tais-toi",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "tener un encuentro sexual",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "trabajo sexual",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "travail du sexe",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "trou du cul",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "trous du cul",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "t\u00eate de merde",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "t\u00eates de merde",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "va te faire foutre",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "vai-te embora",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "verme",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "vermes",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "versager",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "vollidiot",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
  {
    keyword: "vollidioten",
    category: ViolationCategory.HARASSMENT,
    severity: 2,
  },
];
