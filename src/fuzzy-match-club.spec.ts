import Fuse, { FuseResult } from 'fuse.js';
import ClubMatcher from './fuzzy-match-club';

describe('Fuzzy Match Club', () => {
  let fuseSearchSpy: jest.SpyInstance;

  test('Ensure getClubNameFromFuzzySearch can handle a single match scenario', () => {
    const MockClubName = 'TEST';
    fuseSearchSpy = jest.spyOn(Fuse.prototype, 'search');
    fuseSearchSpy.mockReturnValue([
      {
        item: MockClubName,
        score: 0.15
      } as FuseResult<string>
    ]);
    const clubName = new ClubMatcher().getClubNameFromFuzzySearch(MockClubName);
    expect(clubName).toEqual(MockClubName);
  });

  test('Ensure getClubNameFromFuzzySearch can handle a single match scenario with score of 0', () => {
    const MockClubName = 'TEST';
    fuseSearchSpy = jest.spyOn(Fuse.prototype, 'search');
    fuseSearchSpy.mockReturnValue([
      {
        item: MockClubName,
        score: 0
      } as FuseResult<string>
    ]);
    const clubName = new ClubMatcher().getClubNameFromFuzzySearch(MockClubName);
    expect(clubName).toEqual(MockClubName);
  });

  test('Ensure getClubNameFromFuzzySearch can handle a multi match scenario', () => {
    const MockClubName = 'TEST';
    fuseSearchSpy = jest.spyOn(Fuse.prototype, 'search');
    fuseSearchSpy.mockReturnValue([
      {
        item: MockClubName,
        score: 0.15
      } as FuseResult<string>,
      {
        item: 'Other Club',
        score: 0.2
      } as FuseResult<string>
    ]);
    const clubName = new ClubMatcher().getClubNameFromFuzzySearch(MockClubName);
    expect(clubName).toEqual(MockClubName);
  });

  test('Ensure getClubNameFromFuzzySearch can handle a no match scenario', () => {
    const MockClubName = 'TEST';
    fuseSearchSpy = jest.spyOn(Fuse.prototype, 'search');
    fuseSearchSpy.mockReturnValue([]);
    const clubName = new ClubMatcher().getClubNameFromFuzzySearch(MockClubName);
    expect(clubName).toBeNull();
  });
});
