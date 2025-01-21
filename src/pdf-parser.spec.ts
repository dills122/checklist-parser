import Fuse, { FuseResult } from 'fuse.js';
import ChecklistParser, { CardObject } from './pdf-parser';

describe('PDF Parser', () => {
  describe('utils', () => {
    let pdfParserObj: ChecklistParser;
    beforeAll(() => {
      pdfParserObj = new ChecklistParser();
    });
    it('checkIfFirstLetterOfStringIsCaptial', () => {
      const checkIfFirstLetterOfStringIsCaptial = pdfParserObj['checkIfFirstLetterOfStringIsCaptial'];
      expect(checkIfFirstLetterOfStringIsCaptial('A')).toBeTruthy();
      expect(checkIfFirstLetterOfStringIsCaptial('a')).toBeFalsy();
      expect(checkIfFirstLetterOfStringIsCaptial('Aa')).toBeTruthy();
      expect(checkIfFirstLetterOfStringIsCaptial('aa')).toBeFalsy();
      expect(checkIfFirstLetterOfStringIsCaptial('AA')).toBeTruthy();
    });
    it('verifyIfPlayerTypeIsPresent', () => {
      const verifyIfPlayerTypeIsPresent = pdfParserObj['verifyIfPlayerTypeIsPresent'];
      expect(verifyIfPlayerTypeIsPresent('not one')).toBeFalsy();
      expect(verifyIfPlayerTypeIsPresent('veteran')).toBeTruthy();
      expect(verifyIfPlayerTypeIsPresent('Veteran')).toBeTruthy();
      expect(verifyIfPlayerTypeIsPresent('VETERAN')).toBeTruthy();
      expect(verifyIfPlayerTypeIsPresent('rookie')).toBeTruthy();
      expect(verifyIfPlayerTypeIsPresent('Rookie')).toBeTruthy();
      expect(verifyIfPlayerTypeIsPresent('ROOKIE')).toBeTruthy();
      expect(verifyIfPlayerTypeIsPresent('retired')).toBeTruthy();
      expect(verifyIfPlayerTypeIsPresent('Retired')).toBeTruthy();
      expect(verifyIfPlayerTypeIsPresent('RETIRED')).toBeTruthy();
    });
    it('verifyIfCardNumberIsPresent', () => {
      const verifyIfCardNumberIsPresent = pdfParserObj['verifyIfCardNumberIsPresent'];
      expect(verifyIfCardNumberIsPresent('1')).toBeTruthy();
      expect(verifyIfCardNumberIsPresent('10')).toBeTruthy();
      expect(verifyIfCardNumberIsPresent('100')).toBeTruthy();
      expect(verifyIfCardNumberIsPresent('200')).toBeTruthy();
      expect(verifyIfCardNumberIsPresent('2000')).toBeTruthy();
      expect(verifyIfCardNumberIsPresent('AB-1')).toBeTruthy();
      expect(verifyIfCardNumberIsPresent('1-B')).toBeFalsy();
      expect(verifyIfCardNumberIsPresent('BOTB-15')).toBeTruthy();
      expect(verifyIfCardNumberIsPresent('MG-14')).toBeTruthy();
      expect(verifyIfCardNumberIsPresent('A-GV')).toBeTruthy();
      expect(verifyIfCardNumberIsPresent('FSA-AP')).toBeTruthy();
      expect(verifyIfCardNumberIsPresent('API-E')).toBeTruthy();
    });
    it('verifyIfHeaderTextIsPresent', () => {
      expect(
        pdfParserObj['verifyIfHeaderTextIsPresent']('ROOKIE ARRIVAL AUTOGRAPH PATCH INSCRIPTION')
      ).toBeTruthy();
      expect(
        pdfParserObj['verifyIfHeaderTextIsPresent']('ULTIMATE STAGE CHROME CARDS AUTOGRAPH VARIATION')
      ).toBeTruthy();
      expect(
        pdfParserObj['verifyIfHeaderTextIsPresent']('ultimate STAGE chrome CARDS AUTOGRAPH variation')
      ).toBeFalsy();
      expect(pdfParserObj['verifyIfHeaderTextIsPresent']('MOJO')).toBeTruthy();
      expect(pdfParserObj['verifyIfHeaderTextIsPresent']('mojo')).toBeFalsy();
      expect(pdfParserObj['verifyIfHeaderTextIsPresent']('COVER STARS')).toBeTruthy();
      expect(pdfParserObj['verifyIfHeaderTextIsPresent']('BEST 10')).toBeFalsy();
    });

    it('isAllCaps', () => {
      const isAllCaps = pdfParserObj['isAllCaps'];
      expect(isAllCaps('A')).toBeTruthy();
      expect(isAllCaps('AA')).toBeTruthy();
      expect(isAllCaps('Aa')).toBeFalsy();
      expect(isAllCaps('AAA')).toBeTruthy();
      expect(isAllCaps('AAAAAAAAAAAAAAA')).toBeTruthy();
    });

    it('checkIfCardHasNoCardNumberButAllOthersAreSet', () => {
      const passCheck: CardObject = {
        cardNumber: null,
        club: 'CLUB',
        player: 'PLAYER',
        type: 'rookie'
      };
      expect(pdfParserObj['checkIfCardHasNoCardNumberButAllOthersAreSet'](passCheck)).toBeTruthy();
      const failCheck: CardObject = {
        cardNumber: 'NUM',
        club: 'CLUB',
        player: 'PLAYER',
        type: 'rookie'
      };
      expect(pdfParserObj['checkIfCardHasNoCardNumberButAllOthersAreSet'](failCheck)).toBeFalsy();
    });
    it('checkIfCardHasAtleastCardNumAndSomeOthers', () => {
      const allSetObj: CardObject = {
        cardNumber: 'AB',
        club: 'CLUB',
        player: 'PLAYER',
        type: 'rookie'
      };
      expect(pdfParserObj['checkIfCardHasAtleastCardNumAndSomeOthers'](allSetObj)).toBeTruthy();
      const mostSetObj: CardObject = {
        cardNumber: 'AB',
        club: 'CLUB',
        player: null,
        type: 'rookie'
      };
      expect(pdfParserObj['checkIfCardHasAtleastCardNumAndSomeOthers'](mostSetObj)).toBeTruthy();
      const noCardNum: CardObject = {
        cardNumber: null,
        club: 'CLUB',
        player: 'PLAYER',
        type: 'rookie'
      };
      expect(pdfParserObj['checkIfCardHasAtleastCardNumAndSomeOthers'](noCardNum)).toBeFalsy();
      const nonSet: CardObject = {
        cardNumber: null,
        club: null,
        player: null,
        type: null
      };
      expect(pdfParserObj['checkIfCardHasAtleastCardNumAndSomeOthers'](nonSet)).toBeFalsy();
    });
  });
});
