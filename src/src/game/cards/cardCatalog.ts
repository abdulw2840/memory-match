export interface CardDefinition {
  readonly pairId: string;
  readonly name: string;
  readonly artwork: string;
  readonly color: string;
}

/** Original inline vector artwork keeps the starter game independent of external image services. */
export const CARD_CATALOG: readonly CardDefinition[] = [
  {
    pairId: "rocket",
    name: "Rocket",
    color: "#83D5F6",
    artwork: `<svg viewBox="0 0 120 120" role="img" aria-label="Rocket" xmlns="http://www.w3.org/2000/svg">
      <path d="M59 15C78 20 91 42 88 69L61 96 34 69C31 42 44 20 59 15Z" fill="#FF6E75" stroke="#B94760" stroke-width="4" stroke-linejoin="round"/>
      <path d="M59 17C69 28 73 44 72 61L61 72 48 60C47 43 50 28 59 17Z" fill="#FFF5DE"/>
      <circle cx="60" cy="50" r="10" fill="#62C9F2" stroke="#247DA9" stroke-width="4"/>
      <path d="M35 58 19 77 40 77M84 58 101 77 80 77" fill="#FFC34D" stroke="#B97828" stroke-width="4" stroke-linejoin="round"/>
      <path d="m48 83 12 13 12-13-5 23H53Z" fill="#FFB53E"/>
      <path d="m55 94 5 5 5-5-5 18Z" fill="#FF705F"/>
    </svg>`,
  },
  {
    pairId: "strawberry",
    name: "Strawberry",
    color: "#FFB2B0",
    artwork: `<svg viewBox="0 0 120 120" role="img" aria-label="Strawberry" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 35C40 21 20 37 27 62 33 83 52 102 60 108 68 102 87 83 93 62 100 37 80 21 60 35Z" fill="#FF6677" stroke="#C8435A" stroke-width="4"/>
      <path d="M59 35c-8-15-20-13-26-8 10 0 13 8 15 15m12-7c1-15 12-20 20-16-8 3-10 11-10 19m-11-2c-2-13 3-21 9-25-1 10-2 18-1 27" fill="#58C98C" stroke="#319A68" stroke-width="3" stroke-linejoin="round"/>
      <g fill="#FFE79A"><ellipse cx="43" cy="58" rx="2.5" ry="4"/><ellipse cx="62" cy="55" rx="2.5" ry="4"/><ellipse cx="78" cy="61" rx="2.5" ry="4"/><ellipse cx="51" cy="78" rx="2.5" ry="4"/><ellipse cx="70" cy="81" rx="2.5" ry="4"/><ellipse cx="60" cy="95" rx="2" ry="3"/></g>
      <path d="M39 44q6-4 11-1" fill="none" stroke="#FFB1B1" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    pairId: "turtle",
    name: "Turtle",
    color: "#AEECCB",
    artwork: `<svg viewBox="0 0 120 120" role="img" aria-label="Turtle" xmlns="http://www.w3.org/2000/svg">
      <path d="m36 75-13 10 2 12 18-7m42-15 13 10-2 12-18-7" fill="#72D59B" stroke="#359C70" stroke-width="4" stroke-linejoin="round"/>
      <path d="M45 72 34 91l-14 2-5-10 15-20m45 9 11 19 14 2 5-10-15-20" fill="#78DEA2" stroke="#359C70" stroke-width="4" stroke-linejoin="round"/>
      <ellipse cx="60" cy="62" rx="34" ry="29" fill="#ECA65D" stroke="#A86B3D" stroke-width="5"/>
      <path d="M60 36v51M29 61h62M39 43l42 37M81 43 39 80" stroke="#BF7B43" stroke-width="3" fill="none"/>
      <path d="M83 54c18-3 24 8 21 20-3 10-14 14-23 7" fill="#83E2A8" stroke="#359C70" stroke-width="4"/>
      <circle cx="94" cy="65" r="3.5" fill="#314B4A"/><path d="M91 75q5 4 10 0" fill="none" stroke="#237A5B" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  {
    pairId: "rainbow",
    name: "Rainbow",
    color: "#D7C7FF",
    artwork: `<svg viewBox="0 0 120 120" role="img" aria-label="Rainbow" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 88a43 43 0 0 1 86 0" fill="none" stroke="#F06D78" stroke-width="13" stroke-linecap="round"/>
      <path d="M29 88a31 31 0 0 1 62 0" fill="none" stroke="#FFBE52" stroke-width="12" stroke-linecap="round"/>
      <path d="M41 88a19 19 0 0 1 38 0" fill="none" stroke="#6DCB9D" stroke-width="12" stroke-linecap="round"/>
      <path d="M53 88a7 7 0 0 1 14 0" fill="none" stroke="#65BFF0" stroke-width="12" stroke-linecap="round"/>
      <path d="M15 87q-4-12 8-17 8-12 20-4 10-12 22-5 12-7 20 4 15-4 19 12 9 3 3 11" fill="#FFFFFF" stroke="#D9E8FF" stroke-width="3"/>
      <circle cx="42" cy="76" r="2.5" fill="#687A9B"/><circle cx="77" cy="76" r="2.5" fill="#687A9B"/>
      <path d="M55 82q5 6 10 0" fill="none" stroke="#687A9B" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
  },
] as const;
