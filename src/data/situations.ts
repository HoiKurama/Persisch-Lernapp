export interface Situation {
  id: string;
  title: string;
  description: string;
  steps: Array<{ vocabId: string; context: string }>;
}

/** German role-play prompts use the existing sourced expressions without adding translations. */
export const SITUATIONS: Situation[] = [
  {
    id: 'kennenlernen', title: 'Jemanden kennenlernen',
    description: 'Ein kurzes, informelles Gespräch: begrüßen, nachfragen und verabschieden.',
    steps: [
      { vocabId: 'begruessung-001-salam', context: 'Du triffst jemanden zum ersten Mal. Begrüße die Person.' },
      { vocabId: 'begruessung-008-chetori', context: 'Frag die Person informell, wie es ihr geht.' },
      { vocabId: 'begruessung-009-khoobam', context: 'Die Person fragt zurück, wie es dir geht. Dir geht es gut.' },
      { vocabId: 'begruessung-011-khoshbakhtam', context: 'Ihr habt euch vorgestellt. Sag, dass du dich freust.' },
      { vocabId: 'begruessung-002-khodahafez', context: 'Das Gespräch endet. Verabschiede dich.' },
    ],
  },
  {
    id: 'hoeflichkeit', title: 'Höflich im Alltag',
    description: 'Aufmerksamkeit gewinnen, um etwas bitten und sich bedanken.',
    steps: [
      { vocabId: 'begruessung-007-bebakhshid', context: 'Du möchtest jemanden ansprechen. Sag zuerst „Entschuldigung“.' },
      { vocabId: 'begruessung-005-lotfan', context: 'Du bittest um etwas. Ergänze das passende „Bitte“.' },
      { vocabId: 'begruessung-006-merci', context: 'Die Person hilft dir. Bedanke dich.' },
      { vocabId: 'begruessung-016-khaheshmikonam', context: 'Später bedankt sich jemand bei dir. Antworte mit „Gern geschehen“.' },
    ],
  },
  {
    id: 'verstaendigung', title: 'Wenn du etwas nicht verstehst',
    description: 'Im Gespräch um Hilfe bitten und eine andere Sprache anbieten.',
    steps: [
      { vocabId: 'begruessung-007-bebakhshid', context: 'Du unterbrichst höflich, weil du nicht folgen kannst.' },
      { vocabId: 'begruessung-032-nemifahmam', context: 'Sag der Person, dass du nicht verstehst.' },
      { vocabId: 'begruessung-033-angilisibaladid', context: 'Frag die Person höflich, ob sie Englisch kann.' },
      { vocabId: 'begruessung-006-merci', context: 'Die Person hilft dir weiter. Bedanke dich.' },
      { vocabId: 'begruessung-002-khodahafez', context: 'Du gehst weiter. Verabschiede dich.' },
    ],
  },
];
