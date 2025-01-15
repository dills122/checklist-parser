/* eslint-disable import/no-named-as-default */
import { access } from 'fs/promises';
import PDFParser, { Output } from 'pdf2json';
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

export type cardType = 'Veteran' | 'Rookie' | 'Retired';

export default class ChecklistParser {
  pdfParser: PDFParser;
  fuzzyClubMatcher: FuzzyClubMatcher;
  constructor() {
    this.pdfParser = new PDFParser();
    this.fuzzyClubMatcher = new FuzzyClubMatcher();
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

  async parse(): Promise<ChecklistMap> {
    return new Promise((res, rej) => {
      this.pdfParser.on('pdfParser_dataReady', async (pdfData) => {
        const checklistJson = await this.parseData(pdfData);
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

  private async parseData(data: Output) {
    const textMap: ChecklistMap = {};

    // Extract and decode text in the correct order
    let currentCategory: string | null = null;
    let cardObj: CardObject = {
      cardNumber: null,
      player: null,
      club: null,
      type: null // Veteran, Rookie, Retired
    };
    //TODO move this and do it properly
    const pushCardObjToMap = () => {
      if (!currentCategory) return;
      textMap[currentCategory].push(cardObj);
      cardObj = {
        cardNumber: null,
        player: null,
        club: null,
        type: null // Veteran, Rookie, Retired
      };
    };
    //TODO need to split this out better so I can unit test it
    data.Pages.forEach((page) => {
      // Sort text blocks by vertical (y) and then horizontal (x) positions
      const sortedTexts = page.Texts.sort((a, b) => {
        if (a.y === b.y) {
          return a.x - b.x; // Same line, sort by x-axis (left to right)
        }
        return a.y - b.y; // Sort by y-axis (top to bottom)
      });
      sortedTexts.forEach((textObj) => {
        for (let i = 0; i < textObj.R.length; i++) {
          const t = textObj.R[i];
          const text = decodeURIComponent(t.T);

          if (this.verifyIfHeaderTextIsPresent(text)) {
            if (
              this.checkIfCardHasAtleastCardNumAndSomeOthers(cardObj) ||
              this.checkIfCardHasNoCardNumberButAllOthersAreSet(cardObj)
            ) {
              pushCardObjToMap();
            }
            currentCategory = text;
            textMap[text] = [];
            continue;
          }

          if (this.verifyIfCardNumberIsPresent(text)) {
            if (
              this.checkIfCardHasAtleastCardNumAndSomeOthers(cardObj) ||
              this.checkIfCardHasNoCardNumberButAllOthersAreSet(cardObj)
            ) {
              pushCardObjToMap();
            }
            cardObj.cardNumber = text;
            continue;
          }

          if (this.verifyIfPlayerTypeIsPresent(text)) {
            cardObj.type = text as cardType;
            continue;
          }

          const clubName = this.fuzzyClubMatcher.getClubNameFromFuzzySearch(text);
          if (clubName != null) {
            cardObj.club = clubName;
            continue;
          }

          if (!this.checkIfFirstLetterOfStringIsCaptial(text)) continue;

          if (cardObj.player && cardObj.player.length > 0) {
            cardObj.player += ` ${text}`;
          } else {
            cardObj.player = text;
          }
        }
      });
    });
    if (
      this.checkIfCardHasAtleastCardNumAndSomeOthers(cardObj) ||
      this.checkIfCardHasNoCardNumberButAllOthersAreSet(cardObj)
    ) {
      pushCardObjToMap();
    }

    return textMap;
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
    return ['veteran', 'rookie', 'retired'].includes(text.toLowerCase());
  }

  private checkIfFirstLetterOfStringIsCaptial(text: string): boolean {
    return /^[A-Z]/.test(text);
  }
}
