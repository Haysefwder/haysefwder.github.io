import type {
  GameMasterCharacterSnapshot,
  GameMasterIntroductionResult,
  GameMasterService,
  GameMasterTurnInput,
  GameMasterTurnResult,
  JournalEntryDraft,
} from "./types";

const STARTING_LOCATION = "a vila de Pedraverde";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Deterministic, rule-based stand-in for an AI Game Master.
 *
 * It reacts to a handful of player intents (resting, fighting, shopping, exploring,
 * talking) and otherwise narrates generic continuations. Every turn returns journal
 * entries and an updated campaign summary so the story can be resumed later, and may
 * propose permanent changes to the character (HP, gold) to simulate consequences.
 */
export class MockGameMasterService implements GameMasterService {
  async introduceCampaign(
    character: GameMasterCharacterSnapshot,
    campaignTitle: string
  ): Promise<GameMasterIntroductionResult> {
    const narration = [
      `Bem-vindo, ${character.name}!`,
      `${character.race} ${character.class} de nível ${character.level}, sua jornada em "${campaignTitle}" começa em ${STARTING_LOCATION}, uma vila cercada por colinas verdes e névoa baixa.`,
      `Você está sentado na taverna "O Javali Cansado" quando um mensageiro encharcado de chuva entra correndo e anuncia que luzes estranhas foram vistas na Torre Caída, a noroeste, durante a última noite. Os moradores parecem assustados.`,
      "O que você faz?",
    ].join("\n\n");

    const journalEntries: JournalEntryDraft[] = [
      {
        type: "QUEST",
        title: "Luzes na Torre Caída",
        description:
          "Luzes estranhas foram avistadas na Torre Caída, ao noroeste de Pedraverde. Os moradores estão assustados e pedem ajuda para investigar.",
      },
      {
        type: "EVENT",
        title: "Chegada a Pedraverde",
        description: `${character.name} chega à vila de Pedraverde e se instala na taverna "O Javali Cansado".`,
      },
    ];

    const summary = `${character.name} está na taverna "O Javali Cansado", em Pedraverde, e acaba de saber sobre luzes estranhas na Torre Caída.`;

    return { narration, journalEntries, summary };
  }

  async takeTurn(input: GameMasterTurnInput): Promise<GameMasterTurnResult> {
    const text = normalize(input.playerMessage);

    if (includesAny(text, ["descansar", "dormir", "rest"])) {
      return this.handleRest(input);
    }

    if (
      includesAny(text, [
        "atacar",
        "ataco",
        "lutar",
        "luta",
        "combate",
        "golpe",
        "espada",
        "attack",
      ])
    ) {
      return this.handleCombat(input);
    }

    if (includesAny(text, ["comprar", "compro", "loja", "mercador", "buy"])) {
      return this.handleShopping(input);
    }

    if (includesAny(text, ["explorar", "investigar", "procurar", "examinar", "explore"])) {
      return this.handleExploration(input);
    }

    if (includesAny(text, ["falar", "conversar", "perguntar", "talk"])) {
      return this.handleConversation(input);
    }

    return this.handleGeneric(input);
  }

  private handleRest({ character }: GameMasterTurnInput): GameMasterTurnResult {
    const healed = Math.max(0, character.hpMax - character.hpCurrent);

    const narration =
      healed > 0
        ? [
            `${character.name} encontra um canto tranquilo e descansa por algumas horas.`,
            `Ao despertar, sente as feridas cicatrizarem por completo (${character.hpMax}/${character.hpMax} PV).`,
            "O que você faz agora?",
          ].join("\n\n")
        : [
            `${character.name} já está em plena forma, mas aproveita o momento de calma antes de seguir em frente.`,
            "O que você faz agora?",
          ].join("\n\n");

    return {
      narration,
      journalEntries: [
        {
          type: "EVENT",
          title: "Descanso",
          description:
            healed > 0
              ? `${character.name} descansou e recuperou ${healed} ponto(s) de vida.`
              : `${character.name} descansou, já estando com a saúde plena.`,
        },
      ],
      summary: `${character.name} descansou recentemente e está com ${character.hpMax}/${character.hpMax} pontos de vida.`,
      characterStateChange: healed > 0 ? { hpDelta: healed } : undefined,
    };
  }

  private handleCombat({ character, lastDiceRoll }: GameMasterTurnInput): GameMasterTurnResult {
    const success = lastDiceRoll ? lastDiceRoll.total >= 12 : Math.random() > 0.5;

    if (success) {
      const reward = randomInt(5, 20);
      const remainingGold = character.gold + reward;

      const narration = [
        lastDiceRoll
          ? `Com ${lastDiceRoll.description}, ${character.name} ataca com precisão!`
          : `${character.name} ataca com determinação!`,
        `O golpe acerta o oponente, que recua derrotado. Entre os pertences dele você encontra ${reward} peças de ouro (total: ${remainingGold}).`,
        "O que você faz agora?",
      ].join("\n\n");

      return {
        narration,
        journalEntries: [
          {
            type: "EVENT",
            title: "Vitória em combate",
            description: `${character.name} venceu um confronto e encontrou ${reward} peças de ouro.`,
          },
        ],
        summary: `${character.name} venceu um combate recente e ganhou ${reward} peças de ouro.`,
        characterStateChange: { goldDelta: reward },
      };
    }

    const damage = Math.min(character.hpCurrent, randomInt(1, 4));
    const remainingHp = Math.max(0, character.hpCurrent - damage);

    const narration = [
      lastDiceRoll
        ? `Com ${lastDiceRoll.description}, o ataque de ${character.name} não é suficiente.`
        : `${character.name} tenta atacar, mas o oponente se esquiva e contra-ataca.`,
      `Você sofre ${damage} ponto(s) de dano (${remainingHp}/${character.hpMax} PV).`,
      "O que você faz agora?",
    ].join("\n\n");

    return {
      narration,
      journalEntries: [
        {
          type: "EVENT",
          title: "Ferido em combate",
          description: `${character.name} sofreu ${damage} ponto(s) de dano em um confronto.`,
        },
      ],
      summary: `${character.name} ficou ferido em um combate recente (${remainingHp}/${character.hpMax} PV).`,
      characterStateChange: damage > 0 ? { hpDelta: -damage } : undefined,
    };
  }

  private handleShopping({ character }: GameMasterTurnInput): GameMasterTurnResult {
    const cost = 10;

    if (character.gold >= cost) {
      const remainingGold = character.gold - cost;
      const narration = [
        `O mercador sorri e entrega um pequeno suprimento (rações, corda e uma adaga extra) em troca de ${cost} peças de ouro.`,
        `Seu saldo agora é ${remainingGold} de ouro.`,
        "O que você faz agora?",
      ].join("\n\n");

      return {
        narration,
        journalEntries: [
          {
            type: "EVENT",
            title: "Compra no mercado",
            description: `${character.name} comprou suprimentos por ${cost} peças de ouro.`,
          },
        ],
        summary: `${character.name} comprou suprimentos e ficou com ${remainingGold} de ouro.`,
        characterStateChange: { goldDelta: -cost },
      };
    }

    const narration = [
      `O mercador examina sua bolsa quase vazia e nega com a cabeça: "Volte quando tiver mais ouro, aventureiro."`,
      "O que você faz agora?",
    ].join("\n\n");

    return {
      narration,
      journalEntries: [],
      summary: `${character.name} não tinha ouro suficiente para comprar suprimentos.`,
    };
  }

  private handleExploration({ character }: GameMasterTurnInput): GameMasterTurnResult {
    if (Math.random() > 0.5) {
      const gold = randomInt(1, 10);
      const remainingGold = character.gold + gold;

      const narration = [
        `${character.name} explora a área com cuidado e encontra ${gold} peças de ouro escondidas entre as pedras (total: ${remainingGold}).`,
        "O que você faz agora?",
      ].join("\n\n");

      return {
        narration,
        journalEntries: [
          {
            type: "EVENT",
            title: "Achado durante exploração",
            description: `${character.name} encontrou ${gold} peças de ouro durante uma exploração.`,
          },
        ],
        summary: `${character.name} encontrou ${gold} peças de ouro durante uma exploração recente.`,
        characterStateChange: { goldDelta: gold },
      };
    }

    const narration = [
      `${character.name} explora a área com cuidado, mas encontra apenas silêncio e sombras.`,
      "Talvez valha a pena seguir em outra direção. O que você faz agora?",
    ].join("\n\n");

    return {
      narration,
      journalEntries: [],
      summary: `${character.name} explorou a área ao redor de ${STARTING_LOCATION} sem encontrar nada de novo.`,
    };
  }

  private handleConversation({ character }: GameMasterTurnInput): GameMasterTurnResult {
    const narration = [
      `Um morador local se aproxima e compartilha um rumor: "Dizem que a Torre Caída já foi um observatório de magos, há séculos. Ninguém que entrou lá recentemente voltou para contar o que viu."`,
      "Ele se afasta com um aceno nervoso. O que você faz agora?",
    ].join("\n\n");

    return {
      narration,
      journalEntries: [
        {
          type: "EVENT",
          title: "Rumores na taverna",
          description: `${character.name} ouviu rumores sobre a Torre Caída ser um antigo observatório de magos.`,
        },
      ],
      summary: `${character.name} ouviu rumores sobre a história da Torre Caída.`,
    };
  }

  private handleGeneric({ character, playerMessage }: GameMasterTurnInput): GameMasterTurnResult {
    const narration = [
      `O Mestre considera a ação de ${character.name}: "${playerMessage}"`,
      `A névoa se move lentamente ao redor de ${STARTING_LOCATION}, e o caminho para a Torre Caída continua à distância, esperando ser explorado.`,
      "Suas escolhas moldarão o que vem a seguir. O que você faz agora?",
    ].join("\n\n");

    return {
      narration,
      journalEntries: [
        {
          type: "DECISION",
          title: "Decisão do jogador",
          description: `${character.name} decidiu: "${playerMessage}"`,
        },
      ],
      summary: `${character.name} decidiu: "${playerMessage}"`,
    };
  }
}
