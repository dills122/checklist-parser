import Fuse from 'fuse.js';

const clubNames = [
  'Real Madrid C.F.',
  'FC Internazionale Milano',
  'Bayer 04 Leverkusen',
  'Paris Saint-Germain',
  'Arsenal FC',
  'FC Barcelona',
  'Atlético de Madrid',
  'Manchester City',
  'FC Bayern München',
  'AC Milan',
  'Tottenham Hotspur',
  'Rangers F.C.',
  'Real Betis Balompié',
  'AS Monaco',
  'Juventus',
  'Manchester United',
  'FC Shakhtar Donetsk',
  'Chelsea FC',
  'Aston Villa',
  'SL Benfica',
  'Feyenoord',
  'Liverpool FC',
  'Borussia Dortmund',
  'PSV Eindhoven',
  'Sporting Clube de Portugal',
  'Celtic FC',
  'Olympiacos FC',
  'Atalanta B.C.'
];

export default class ClubMatcher {
  fuseOptions = {
    includeScore: true,
    threshold: 0.3 // Lower threshold = stricter match
  };
  fuse: Fuse<string>;
  constructor() {
    this.fuse = new Fuse(clubNames, this.fuseOptions);
  }

  getClubNameFromFuzzySearch(input: string): string | null {
    const result = this.fuse.search(input);
    const bestMatch = result[0];
    if (bestMatch?.score != null && bestMatch?.score <= this.fuseOptions.threshold) {
      return bestMatch.item;
    }
    return null;
  }
}
