import { MediaFormat, StreamingServers } from '../../src/models';
import { MOVIES } from '../../src/providers';

jest.setTimeout(120000);

const twoEmbed = new MOVIES.TwoEmbed();

test('returns a filled object of streaming servers', async () => {
  const data = await twoEmbed.fetchEpisodeServers('66788', MediaFormat.TV, 1, 1);
  expect(data).not.toEqual([]);
});

test('returns a filled object of streaming sources', async () => {
  const data = await twoEmbed.fetchEpisodeSources('66788', MediaFormat.TV, 1, 1, StreamingServers.VidCloud);
  expect(data).not.toEqual([]);
});
