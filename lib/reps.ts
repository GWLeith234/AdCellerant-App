export interface RepConfig {
  key: string;
  name: string;
  role: string;
  photo: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  flag?: "ca" | "uk";
  isRamp?: boolean;
}

export const REP_CONFIGS: RepConfig[] = [
  {
    key: "george",
    name: "George Leith",
    role: "President, International",
    photo: "/reps/george.jpg",
    borderColor: "#FF0000",
    gradientFrom: "#FF0000",
    gradientTo: "#8B0000",
    flag: "ca",
  },
  {
    key: "andy",
    name: "Andy McNab",
    role: "Managing Director UK",
    photo: "/reps/andy.jpg",
    borderColor: "#012169",
    gradientFrom: "#012169",
    gradientTo: "#C8102E",
    flag: "uk",
  },
  {
    key: "alex",
    name: "Alex Kirkley",
    role: "Director Agency Partnerships",
    photo: "/reps/alex.jpg",
    borderColor: "#012169",
    gradientFrom: "#012169",
    gradientTo: "#C8102E",
    flag: "uk",
    isRamp: true,
  },
  {
    key: "vendasta",
    name: "Vendasta",
    role: "Strategic Partnership \u00b7 CA",
    photo: "/reps/vendasta.png",
    borderColor: "#2ECC8A",
    gradientFrom: "#2ECC8A",
    gradientTo: "#1A9B5C",
  },
];

export function getRepConfig(key: string): RepConfig | undefined {
  return REP_CONFIGS.find((r) => r.key === key);
}
