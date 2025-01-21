/* eslint-disable import/no-named-as-default */
import { access } from 'fs/promises';
import PDFParser, { Output, Page } from 'pdf2json';
import FuzzyClubMatcher from './fuzzy-match-club';

export interface CardObject {
  cardNumber: string | null;
  player: string | null;
  club: string | null;
  type: cardType | null;
}

export interface ChecklistMap {
  [key: string]: CardObject[];
}

export const cardTypes = ['veteran', 'rookie', 'retired', 'debutant'] as const;

export type cardType = (typeof cardTypes)[number];

export const isCardType = (value: string): value is cardType => {
  return (cardTypes as readonly string[]).includes(value);
};

export default class ChecklistParser {
  private pdfParser: PDFParser;
  private fuzzyClubMatcher: FuzzyClubMatcher;
  private currentCategory: string | null | undefined;
  private card: CardObject = {
    cardNumber: null,
    player: null,
    club: null,
    type: null
  };
  private textMap: ChecklistMap = {};

  constructor() {
    this.pdfParser = new PDFParser();
    this.fuzzyClubMatcher = new FuzzyClubMatcher();
  }

  async parseFile(bufferOrPath: string | Buffer, isInternationalTeamProduct?: boolean) {
    await this.loadFile(bufferOrPath);
    return await this.parse(isInternationalTeamProduct);
  }

  async loadFile(bufferOrPath: string | Buffer) {
    try {
      if (typeof bufferOrPath === 'string') {
        if (!(await this.fileExists(bufferOrPath))) throw Error('Given file not found or accessible');
        return await this.pdfParser.loadPDF(bufferOrPath);
      } else {
        return await this.pdfParser.parseBuffer(bufferOrPath);
      }
    } catch (err) {
      console.error(err);
      throw Error('Issue reading input file, check your input type data');
    }
  }

  async parse(isInternationalTeamProduct?: boolean): Promise<ChecklistMap> {
    return new Promise((res, rej) => {
      this.pdfParser.on('pdfParser_dataReady', async (pdfData) => {
        const checklistJson = await this.parseData(pdfData, isInternationalTeamProduct);
        return res(checklistJson);
      });
      this.pdfParser.on('pdfParser_dataError', (errData) => {
        console.error('Error: ', errData.parserError);
        return rej(errData);
      });
    });
  }

  private async fileExists(filePath: string) {
    try {
      await access(filePath);
      return true;
    } catch (err) {
      return false;
    }
  }

  private async parseData(data: Output, isInternationalTeamProduct?: boolean): Promise<ChecklistMap> {
    this.textMap = {};
    this.currentCategory = null;
    this.resetCardObj();

    data.Pages.forEach((page) => {
      const sortedTexts = this.sortTextItems(page);
      sortedTexts.forEach((textObj) => {
        for (let i = 0; i < textObj.R.length; i++) {
          const t = textObj.R[i];
          this.matchStringToCardProperty(t.T, isInternationalTeamProduct);
        }
      });
    });
    this.checkIfReadyToPushCard();

    return this.textMap;
  }

  /**
   * Sort text blocks by vertical (y) and then horizontal (x) positions
   * @param page {Page} pdf2json Page
   * @returns
   */
  private sortTextItems(page: Page) {
    return page.Texts.sort((a, b) => {
      if (a.y === b.y) {
        return a.x - b.x; // Same line, sort by x-axis (left to right)
      }
      return a.y - b.y; // Sort by y-axis (top to bottom)
    });
  }

  private matchStringToCardProperty(rawText: string, isInternationalTeamProduct?: boolean) {
    const text = decodeURIComponent(rawText);
    do {
      if (this.verifyIfPlayerTypeIsPresent(text)) {
        this.checkIfReadyToPushCard();
        this.card.type = text as cardType;
        continue;
      }

      if (this.verifyIfHeaderTextIsPresent(text)) {
        this.checkIfReadyToPushCard();
        this.currentCategory = text;
        this.textMap[text] = [];
        continue;
      }

      if (this.verifyIfCardNumberIsPresent(text)) {
        this.checkIfReadyToPushCard();
        this.card.cardNumber = text;
        continue;
      }

      // International/National Team checklists seem to not have a club/nation name so skip this
      if (!isInternationalTeamProduct) {
        const clubName = this.fuzzyClubMatcher.getClubNameFromFuzzySearch(text);
        if (clubName != null) {
          this.card.club = clubName;
          continue;
        }
      }

      if (!this.checkIfFirstLetterOfStringIsCaptial(text)) continue;

      if (this.card.player && this.card.player.length > 0) {
        this.card.player += ` ${text}`;
      } else {
        this.card.player = text;
      }
      // eslint-disable-next-line no-constant-condition
    } while (false);
  }

  private checkIfReadyToPushCard() {
    if (
      this.checkIfCardHasAtleastCardNumAndSomeOthers(this.card) ||
      this.checkIfCardHasNoCardNumberButAllOthersAreSet(this.card)
    ) {
      this.pushCardObjToMap();
    }
  }

  private pushCardObjToMap() {
    if (!this.currentCategory) return;
    this.textMap[this.currentCategory].push(this.card);
    this.resetCardObj();
  }

  private resetCardObj() {
    this.card = {
      cardNumber: null,
      player: null,
      club: null,
      type: null
    };
  }

  private checkIfCardHasAtleastCardNumAndSomeOthers(card: CardObject): boolean {
    if (!card) {
      return false;
    }
    const { cardNumber, player, club, type } = card;
    return !!cardNumber && [player, club, type].some((item) => item != null);
  }

  private checkIfCardHasNoCardNumberButAllOthersAreSet(card: CardObject): boolean {
    if (!card) {
      return false;
    }
    const { cardNumber, player, club, type } = card;
    return cardNumber == null && [player, club, type].every((item) => item != null);
  }

  private isAllCaps(text: string): boolean {
    return text === text.toUpperCase() && /[A-Z]/.test(text);
  }

  private verifyIfHeaderTextIsPresent(text: string): boolean {
    const isStringInHeaderFormat = /^[A-Za-z\s]+$/.test(text);
    return (
      text.length > 1 &&
      isStringInHeaderFormat &&
      this.isAllCaps(text) &&
      !this.verifyIfCardNumberIsPresent(text)
    );
  }

  private verifyIfCardNumberIsPresent(text: string): boolean {
    return /^(?:\d+|[A-Z]+-[A-Z\d]+)$/.test(text);
  }

  private verifyIfPlayerTypeIsPresent(text: string): boolean {
    return isCardType(text.toLowerCase());
  }

  private checkIfFirstLetterOfStringIsCaptial(text: string): boolean {
    return /^[A-Z]/.test(text);
  }
}
