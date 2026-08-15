export type UniversitySourceLink = {
  label: string;
  url: string;
};

export type VerifiedUniversitySourceData = {
  academicYear: string;
  applicationFee: {
    amountLabel: string;
    context: string;
  };
  livingCosts: {
    amountLabel: string;
    context: string;
  };
  notes: string[];
  scope: string;
  sources: UniversitySourceLink[];
  tuition: {
    annualFilterAmount: number;
    amountLabel: string;
    context: string;
    currency: string;
  };
  verifiedAt: string;
};

export const universitySourceData: Record<string, VerifiedUniversitySourceData> = {
  "1": {
    academicYear: "2025-26 published program rates",
    applicationFee: {
      amountLabel: "CAD 130 per application",
      context: "The Department of Computer Science charges a separate, non-refundable fee for each graduate application.",
    },
    livingCosts: {
      amountLabel: "CAD 14,395-37,848 per year",
      context: "Current listed St. George residence ranges; inclusions and lease lengths vary, and many options include a meal plan.",
    },
    notes: [
      "Computer Science publishes different totals for international MSc and PhD students.",
      "The 2026-27 university fee explorer is the final authority for the applicant's program and status.",
    ],
    scope: "International graduate planning example for Computer Science",
    sources: [
      {
        label: "Computer Science funding and tuition",
        url: "https://web.cs.toronto.edu/graduate/funding-tuition-awards",
      },
      {
        label: "Computer Science application instructions",
        url: "https://web.cs.toronto.edu/graduate/how-to-apply",
      },
      {
        label: "Current residence fees",
        url: "https://future.utoronto.ca/housing",
      },
    ],
    tuition: {
      annualFilterAmount: 34900,
      amountLabel: "CAD 9,240.48-34,900.48 per year",
      context: "Published international Computer Science PhD/MSc totals, including incidental and ancillary fees.",
      currency: "CAD",
    },
    verifiedAt: "2026-07-26",
  },
  "2": {
    academicYear: "2026",
    applicationFee: {
      amountLabel: "VPD handling fee may apply",
      context: "TUM applies through TUMonline. Many international applicants must also obtain paid preliminary documentation from uni-assist.",
    },
    livingCosts: {
      amountLabel: "EUR 992+ per month",
      context: "TUM cites EUR 992 per month as the minimum proof of funds from January 2025; actual Munich costs can be higher.",
    },
    notes: [
      "New non-EU/EEA bachelor's and master's students generally pay program-specific tuition.",
      "EU/EEA students, doctoral candidates, and listed exemption groups do not pay this international tuition.",
      "The Munich/Garching semester fee was EUR 97 in summer 2026.",
    ],
    scope: "New non-EU/EEA bachelor's and master's students",
    sources: [
      {
        label: "International tuition rules",
        url: "https://www.tum.de/en/studies/fees/tuition",
      },
      {
        label: "Semester fees",
        url: "https://www.tum.de/en/studies/fees",
      },
      {
        label: "International application and VPD",
        url: "https://www.tum.de/en/studies/application/application-info-portal/uni-assist",
      },
      {
        label: "Preparing for study and living-cost proof",
        url: "https://www.international.tum.de/en/global/exchangestudents/general-information-for-international-students/preparing-your-stay/",
      },
    ],
    tuition: {
      annualFilterAmount: 12000,
      amountLabel: "EUR 8,000-12,000 per year",
      context: "Most master's programs charge EUR 4,000 or EUR 6,000 per semester for newly enrolled non-EU/EEA students.",
      currency: "EUR",
    },
    verifiedAt: "2026-07-26",
  },
  "3": {
    academicYear: "2026-27",
    applicationFee: {
      amountLabel: "No separate course fee listed",
      context: "The Advanced Computer Science page lists a GBP 2,500 post-offer CAS tuition deposit for self-funded international students.",
    },
    livingCosts: {
      amountLabel: "GBP 18,188 per year",
      context: "University estimate for a full-time postgraduate over 52 weeks, equivalent to about GBP 1,510 per month.",
    },
    notes: [
      "International tuition is course-specific.",
      "The displayed tuition is for the 2026 Advanced Computer Science MSc and includes tuition, administration, and computational costs.",
    ],
    scope: "Full-time Advanced Computer Science MSc",
    sources: [
      {
        label: "Advanced Computer Science MSc 2026",
        url: "https://www.manchester.ac.uk/study/masters/courses/list//21573/msc-advanced-computer-science/",
      },
      {
        label: "Postgraduate living-cost estimate",
        url: "https://www.manchester.ac.uk/study/postgraduate-research/funding/living-costs/index.htm",
      },
    ],
    tuition: {
      annualFilterAmount: 39400,
      amountLabel: "GBP 39,400 per year",
      context: "International 2026 entry fee; the same course lists GBP 15,300 for UK students.",
      currency: "GBP",
    },
    verifiedAt: "2026-07-26",
  },
  "4": {
    academicYear: "2026-27",
    applicationFee: {
      amountLabel: "EUR 100 when applicable",
      context: "The fee applies to specified international applicants; exemptions depend on prior education and status.",
    },
    livingCosts: {
      amountLabel: "EUR 975-1,500 per month",
      context: "University estimate including rent but excluding tuition; accommodation alone is listed at EUR 650-1,200 per month.",
    },
    notes: [
      "Tuition depends on nationality, prior degree status, faculty, and program.",
      "Eligible students pay the EUR 2,694 statutory full-time fee instead of the institutional rate.",
    ],
    scope: "Non-EEA Computer Science master's planning example",
    sources: [
      {
        label: "2026-27 tuition schedule",
        url: "https://www.uva.nl/en/education/fees-and-funding/tuition-fees/tuition-fees.html",
      },
      {
        label: "Master's application fee",
        url: "https://www.uva.nl/en/education/admissions/masters/applying-for-a-degree-programme.html",
      },
      {
        label: "Living expenses",
        url: "https://www.uva.nl/en/education/practical-information/living-in-amsterdam/living-expenses/living-expenses-uva.html",
      },
    ],
    tuition: {
      annualFilterAmount: 24150,
      amountLabel: "EUR 24,150 per year",
      context: "2026-27 non-EEA institutional fee for the two-year Computer Science master's.",
      currency: "EUR",
    },
    verifiedAt: "2026-07-26",
  },
  "5": {
    academicYear: "2026-27",
    applicationFee: {
      amountLabel: "PLN 85-100 per choice",
      context: "PLN 85 is standard; PLN 100 applies when a written exam, oral exam, or qualification interview is required.",
    },
    livingCosts: {
      amountLabel: "EUR 400-450+ per month",
      context: "University guidance gives this as a minimum. Current dormitory places are listed at roughly PLN 480-1,100 per month.",
    },
    notes: [
      "English-taught tuition is program-specific.",
      "Current examples include EUR 4,200 for Finance, International Investment and Accounting and EUR 4,300 for programs in Political Science and International Studies.",
    ],
    scope: "Selected English-taught programs",
    sources: [
      {
        label: "Application and 2026-27 tuition fees",
        url: "https://rekrutacja.uw.edu.pl/en/application-and-tuition-fees/",
      },
      {
        label: "International student living costs",
        url: "https://informatorects.uw.edu.pl/en/info/mobile-students/",
      },
      {
        label: "Current dormitory fees",
        url: "https://bpm.uw.edu.pl/en/dormitory/",
      },
    ],
    tuition: {
      annualFilterAmount: 4300,
      amountLabel: "EUR 4,200-4,300 per year",
      context: "Representative 2026-27 English-taught program examples; the official program schedule controls.",
      currency: "EUR",
    },
    verifiedAt: "2026-07-26",
  },
  "6": {
    academicYear: "2025-26 latest published standard graduate table",
    applicationFee: {
      amountLabel: "USD 135-155",
      context: "USD 135 for US citizens and permanent residents; USD 155 for international applicants.",
    },
    livingCosts: {
      amountLabel: "USD 21,992-38,640 per year",
      context: "Published non-tuition graduate budget depending on housing, from living at home or in graduate housing through off-campus.",
    },
    notes: [
      "The displayed annual total includes tuition, campus fees, and graduate health insurance.",
      "Nonresident students add USD 15,102 in supplemental tuition to the resident total.",
      "Professional and self-supporting master's programs can use different fee schedules.",
    ],
    scope: "Standard state-supported graduate program",
    sources: [
      {
        label: "Graduate tuition and fees",
        url: "https://www.reg.uci.edu/fees/2025-2026/graduate.html",
      },
      {
        label: "Graduate application fee",
        url: "https://grad.uci.edu/admissions/application-fee-fee-waivers/",
      },
      {
        label: "Graduate cost of attendance",
        url: "https://www.ofas.uci.edu/cost/graduate-costs/continuing-students.php",
      },
      {
        label: "Graduate fellowships and grants",
        url: "https://grad.uci.edu/uc-irvine-graduate-policies-and-procedures/fellowships-and-grants/",
      },
    ],
    tuition: {
      annualFilterAmount: 37217,
      amountLabel: "USD 22,115.31-37,217.31 per year",
      context: "2025-26 resident/nonresident standard graduate totals including mandatory fees and health insurance.",
      currency: "USD",
    },
    verifiedAt: "2026-07-26",
  },
  "7": {
    academicYear: "2026-27",
    applicationFee: {
      amountLabel: "EUR 50-150",
      context: "Foreign-degree MSc applications cost EUR 50 in the early-bird window and EUR 150 in standard application calls.",
    },
    livingCosts: {
      amountLabel: "EUR 400-700 per month for accommodation",
      context: "Politecnico publishes an accommodation range rather than a single all-in living-cost total.",
    },
    notes: [
      "Annual tuition varies with ISEE/ISEEU, study-plan credits, and exemptions.",
      "Reserved non-EU master's students with a foreign first degree generally pay the maximum unless covered by an eligible scholarship.",
      "The first enrolment instalment is EUR 880.04.",
    ],
    scope: "Standard BSc/MSc degree programs",
    sources: [
      {
        label: "2026-27 degree tuition",
        url: "https://dynamicpoli.polimi.it/en/prospective-students/how-much-does-it-cost/laurea-laurea-magistrale-and-single-cycle-programmes",
      },
      {
        label: "2026-27 international MSc application fees",
        url: "https://www.polimi.it/en/prospective-students/how-to-apply/admission-to-laurea-magistrale/foreign-qualification/deadlines",
      },
      {
        label: "Official living-cost guidance",
        url: "https://www.polimi.it/en/prospective-students/how-to-apply/on-arrival-information/useful-information",
      },
    ],
    tuition: {
      annualFilterAmount: 3943,
      amountLabel: "EUR 157.04-3,943.04 per year",
      context: "2026-27 annual range for a standard 46-74 ECTS study plan, before program-specific extras.",
      currency: "EUR",
    },
    verifiedAt: "2026-07-26",
  },
  "8": {
    academicYear: "2026 intake",
    applicationFee: {
      amountLabel: "CAD 118.50-168.25",
      context: "September 2026-August 2027 graduate fee: CAD 118.50 domestic and CAD 168.25 international.",
    },
    livingCosts: {
      amountLabel: "CAD 23,424.68-27,438 per year",
      context: "Housing-and-food planning amounts valid through August 2027: on-campus with meal plan through off-campus.",
    },
    notes: [
      "The Computer Science MSc tuition page lists three instalments per year.",
      "Approximate yearly student fees are CAD 1,203.20; health-plan charges are separate and can change.",
    ],
    scope: "Full-time Computer Science MSc",
    sources: [
      {
        label: "Computer Science MSc tuition",
        url: "https://www.grad.ubc.ca/prospective-students/graduate-degree-programs/master-of-science-computer-science",
      },
      {
        label: "2026-27 graduate application fee",
        url: "https://www.grad.ubc.ca/prospective-students/application-admission/online-application-fee",
      },
      {
        label: "Living-cost planning amounts",
        url: "https://students.ubc.ca/finances/student-loans/funding-us/cost-of-attendance-for-us-students/",
      },
    ],
    tuition: {
      annualFilterAmount: 10082,
      amountLabel: "CAD 10,081.65 per year",
      context: "International full-time Computer Science MSc tuition; the listed domestic rate is CAD 5,738.52.",
      currency: "CAD",
    },
    verifiedAt: "2026-07-26",
  },
  "9": {
    academicYear: "2026",
    applicationFee: {
      amountLabel: "SEK 900 when applicable",
      context: "Non-EU/EEA applicants who are subject to tuition generally pay one national application fee regardless of the number of choices.",
    },
    livingCosts: {
      amountLabel: "SEK 10,656-12,000 per month",
      context: "The 2026 residence-permit minimum is SEK 10,656 per study month; Lund says many students budget up to about SEK 12,000.",
    },
    notes: [
      "Tuition is program-specific and does not apply to EU/EEA/Swiss citizens or PhD study.",
      "The Machine Learning, Systems and Control master's costs SEK 370,000 for the full two-year program.",
    ],
    scope: "Machine Learning, Systems and Control MSc example",
    sources: [
      {
        label: "Machine Learning MSc tuition",
        url: "https://www.lunduniversity.lu.se/study/machine-learning-systems-and-control-masters-programme-TAMSR",
      },
      {
        label: "Application fee",
        url: "https://www.lunduniversity.lu.se/node/82",
      },
      {
        label: "Money and living costs",
        url: "https://www.lunduniversity.lu.se/node/79",
      },
    ],
    tuition: {
      annualFilterAmount: 185000,
      amountLabel: "SEK 185,000 per year",
      context: "Annualized from the SEK 370,000 full fee for the two-year Machine Learning, Systems and Control master's.",
      currency: "SEK",
    },
    verifiedAt: "2026-07-26",
  },
  "10": {
    academicYear: "2026-27",
    applicationFee: {
      amountLabel: "USD 65-90 standard",
      context: "USD 65 for US graduate applicants and USD 90 for international graduate applicants; MBA is USD 200 and MPA is USD 125.",
    },
    livingCosts: {
      amountLabel: "USD 24,568-24,939 per year",
      context: "Graduate housing, food, transport, books, and personal estimate, excluding tuition, for students not living with parents.",
    },
    notes: [
      "Graduate tuition varies by residency, program, and credit load.",
      "The official nonresident total cost of attendance is USD 41,880-44,279 for fall and spring.",
    ],
    scope: "Full-time nonresident graduate student, 9-hour enrollment",
    sources: [
      {
        label: "2026-27 graduate cost of attendance",
        url: "https://onestop.utexas.edu/managing-costs/cost-tuition-rates/cost-of-attendance/",
      },
      {
        label: "Graduate application fees",
        url: "https://gradschool.utexas.edu/admissions/apply",
      },
      {
        label: "Graduate fellowships",
        url: "https://gradschool.utexas.edu/funding/fellowships",
      },
    ],
    tuition: {
      annualFilterAmount: 19340,
      amountLabel: "USD 17,312-19,340 per year",
      context: "2026-27 nonresident graduate tuition range for fall and spring; resident range is USD 8,684-10,554.",
      currency: "USD",
    },
    verifiedAt: "2026-07-26",
  },
};

export function getUniversitySourceData(id: string) {
  return universitySourceData[id];
}
