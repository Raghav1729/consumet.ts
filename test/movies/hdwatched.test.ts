import { MediaFormat, StreamingServers } from '../../src/models';
import { MOVIES } from '../../src/providers';

jest.setTimeout(120000);

const hdWatched = new MOVIES.HDWatched();


// test('returns a filled array of movies/tv', async () => {
//   const data = await hdWatched.search('tt2741602');
//   expect(data.results).not.toEqual([]);
// });

// test('returns a filled object of movies data', async () => {
//   const data = await hdWatched.fetchMediaInfo('/free/36357/john-wick-4');
//   console.log(data);
//   expect(data.description).not.toEqual('');
//   expect(data.episodes).not.toEqual([]);
// });

// test('returns a filled object of tv data', async () => {
//   const data = await hdWatched.fetchMediaInfo('/series/391/the-blacklist-235');
//   console.log(data);
//   expect(data.description).not.toEqual('');
//   expect(data.episodes).not.toEqual([]);
// });

test('returns a filled object of streaming sources', async () => {
  const data = await hdWatched.fetchEpisodeServers('66788', '/free/36340/citadel-season-1-episode-5');
  expect(data).not.toEqual([]);
});
