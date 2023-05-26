import { MediaFormat, StreamingServers } from '../../src/models';
import { MOVIES } from '../../src/providers';

jest.setTimeout(120000);

const watchAMovie = new MOVIES.WatchAMovie();

test('returns a filled object of streaming sources', async () => {
  const data = await watchAMovie.fetchEpisodeSources('66788', MediaFormat.TV, 1, 1, StreamingServers.VidCloud);
  console.log(data);
  expect(data).not.toEqual([]);
});
