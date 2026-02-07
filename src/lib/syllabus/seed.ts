export type SeedSyllabus = Array<{
  subject: string;
  topics: string[];
}>;

// v1 minimal seed. Admin can edit/extend later via admin UI/import.
export const seedSyllabus: SeedSyllabus = [
  {
    subject: "Physical Chemistry",
    topics: [
      "Composition & physical states of matter",
      "Colligative properties",
      "Thermodynamics",
      "Chemical equilibria",
      "Phase rule",
      "Refractive index",
      "Solutions",
      "Electrochemistry",
      "Ionic equilibrium",
      "Kinetics",
    ],
  },
  {
    subject: "Physical Pharmacy",
    topics: [
      "Matter, properties of matter",
      "Micromeritics and powder rheology",
      "Surface and interfacial phenomenon",
      "Viscosity and rheology",
      "Dispersion systems",
      "Complexation",
      "Buffer",
      "Solubility",
      "Concepts of dissolution and diffusion",
    ],
  },
  {
    subject: "Organic Chemistry",
    topics: [
      "General principles",
      "Different classes of compounds",
      "Protection & deprotection of groups",
      "Aromaticity & aromatic chemistry",
      "Different aromatic classes of compounds",
      "Polycyclic aromatic hydrocarbons",
      "Carbonyl chemistry",
    ],
  },
];


