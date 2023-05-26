import { MediaFormat, StreamingServers } from '../../src/models';
import { MOVIES } from '../../src/providers';

jest.setTimeout(120000);

const HdWatched = new MOVIES.HdWatched();


test('returns a filled array of movies/tv', async () => {
  const data = await HdWatched.search('tt10366206');
  expect(data.results).not.toEqual([]);
});

// test('returns a filled object of streaming servers', async () => {
//   const data = await HdWatched.fetchEpisodeServers('66788', MediaFormat.TV, 1, 1);
//   expect(data).not.toEqual([]);
// });

// test('returns a filled object of streaming sources', async () => {
//   const data = await HdWatched.fetchEpisodeSources('66788', MediaFormat.TV, 1, 1, StreamingServers.VidCloud);
//   expect(data).not.toEqual([]);
// });
