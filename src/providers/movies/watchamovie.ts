// import { load } from 'cheerio';
// import axios from 'axios';
// import qs from 'qs';
// import {
//   MovieParser,
//   TvType,
//   IMovieInfo,
//   IEpisodeServer,
//   StreamingServers,
//   ISource,
//   IMovieResult,
//   ISearch,
//   MediaFormat,
// } from '../../models';
// import { MixDrop, VidCloud } from '../../extractors';

// class WatchAMovie extends MovieParser {
//   override readonly name = 'WatchAMovie';
//   protected override baseUrl = 'https://fsa.remotestre.am';
//   protected override logo = 'https://s1.bunnycdn.ru/assets/sites/fmovies/logo2.png';
//   protected override classPath = 'MOVIES.WatchAMovie';
//   override supportedTypes = new Set([TvType.MOVIE, TvType.TVSERIES]);

//   override search(mediaLink: string, ...args: any): Promise<ISearch<IMovieResult>> {
//     throw new Error('Method not implemented. Use META.TMDB to fetch data.');
//   }

//   override fetchMediaInfo(mediaId: string, ...args: any): Promise<IMovieInfo> {
//     throw new Error('Method not implemented. Use META.TMDB to fetch data.');
//   }

//   override async fetchEpisodeServers(mediaId: string, ...args: any): Promise<IEpisodeServer[]> {
//     throw new Error('Method not implemented.');
//   }

//   override async fetchEpisodeSources(
//     tmdbId: string,
//     type: MediaFormat,
//     season?: number,
//     episode?: number,
//     server: StreamingServers = StreamingServers.VidCloud
//   ): Promise<ISource> {
//     try {
//       let url: string;
//       const res: ISource = {
//         headers: {},
//         sources: [],
//       };

//       if (type === MediaFormat.MOVIE) {
//         url = `${this.baseUrl}/Movies/${tmdbId}/${tmdbId}.m3u8`;
//       } else if (type === MediaFormat.TV) {
//         url = `${this.baseUrl}/Shows/${tmdbId}/${season}/${episode}/${episode}.m3u8`;
//       } else {
//         throw new Error('Invalid media format');
//       }

//       res.sources.push({ url: url, isM3U8: true });

//       return res;
//     } catch (err) {
//       throw new Error((err as Error).message);
//     }
//   }
// }

// export default WatchAMovie;
