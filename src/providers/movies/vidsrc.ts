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

// class VidSrc extends MovieParser {
//   override readonly name = 'VidSrc';
//   protected override baseUrl: string = 'https://v2.vidsrc.me/';
//   private referer: string = 'https://vidsrc.stream/';
//   private origin: string = 'https://vidsrc.stream';
//   private embedUrl: string = `${this.baseUrl}embed/`;
//   protected override logo = 'https://s1.bunnycdn.ru/assets/sites/fmovies/logo2.png';
//   protected override classPath = 'MOVIES.VidSrc';
//   override supportedTypes = new Set([TvType.MOVIE, TvType.TVSERIES]);

//   override search(mediaLink: string, ...args: any): Promise<ISearch<IMovieResult>> {
//     throw new Error('Method not implemented. Use META.TMDB to fetch data.');
//   }

//   override fetchMediaInfo(mediaId: string, ...args: any): Promise<IMovieInfo> {
//     throw new Error('Method not implemented. Use META.TMDB to fetch data.');
//   }

//   /**
//    *
//    * @param tmdbId tmdb id
//    * @param type 'movie' or 'tv'
//    * @param season season number
//    * @param episode episode number
//    */
//   override async fetchEpisodeServers(
//     tmdbId: string,
//     type: MediaFormat,
//     season?: number,
//     episode?: number
//   ): Promise<IEpisodeServer[]> {
//     try {
//       let epsiodeServers: IEpisodeServer[] = [];
//       const url =
//         type.toLowerCase() === 'movie'
//           ? `${this.embedUrl}${tmdbId}/`
//           : type.toLowerCase() === 'tv'
//           ? `${this.embedUrl}${tmdbId}/${season}-${episode}/`
//           : '';
//       let res = await axios.get(url);

//       const $ = load(res.data);
//       const hashes = $('div.source')
//         .map((_, el) => $(el).attr('data-hash'))
//         .get();

//       let serverlist = await Promise.all(
//         hashes.map(async hash => {
//           try {
//             res = await axios.get(`${this.baseUrl}srcrcp/${hash}`, {
//               headers: {
//                 referer: this.baseUrl,
//               },
//             });
//             return res.request.res.responseUrl;
//           } catch (error) {
//             //console.log(error);
//           }
//         })
//       );

//       serverlist = serverlist.filter(server => server !== undefined);

//       const finalServerlist = await Promise.all(
//         serverlist.map(async server => {
//           const linkfixed = server.replace('https://vidsrc.xyz/', 'https://embedsito.com/');
//           if (linkfixed.includes('/pro')) {
//             res = await axios.get(server, {
//               headers: {
//                 referer: this.baseUrl,
//               },
//             });
//             const m3u8Regex = /((https:|http:)\/\/.*\.m3u8)/g;
//             const srcm3u8 = m3u8Regex.exec(res.data)![0];
//             const extractorDataRegex = /['"](.*set_pass[^"']*)/;
//             const extractorData = extractorDataRegex.exec(res.data)![1].replace('//', 'https://');

//             return {
//               server: 'pro',
//               url: srcm3u8,
//               extractorData,
//             };
//           }
//           return {
//             server: linkfixed.split('/')[2].split('.')[0],
//             url: linkfixed,
//           };
//         })
//       );

//       const sourceURLS = await Promise.all(
//         finalServerlist.map(async server => {
//           if (server.server === 'pro') {
//             res = await axios.get(server.url, {
//               method: 'GET',
//               headers: {
//                 referer: this.referer,
//               },
//             });
//             if (res.request.res.responseUrl.includes('m3u8')) {
//               return {
//                 server: 'VidSrc Pro',
//                 url: res.request.res.responseUrl as string,
//                 type: 'm3u8',
//                 quality: 'Unknown',
//                 referer: this.referer,
//                 origin: this.origin,
//                 extractorData: server.extractorData,
//                 requiresProxy: true,
//               };
//             }
//           }
//           // if (server.server === 'mixdrop') {
//           //   return await new MixDrop().extract(server.url),
//           // }
//           // if (server.server === 'embedsito') {
//           //   const source = await this..extractUrl(
//           //     server.url.split('/').pop()!
//           //   );
//           //   return source;
//           // }
//           return undefined;
//         })
//       );

//       console.log(sourceURLS);

//     //   epsiodeServers.push({
//     //     name: servers[serverId],
//     //     url: serverString[serverId],
//     // });
//       // const sources = sourceURLS.filter(el => el !== undefined);
//       // console.log(sources);

//       // await Promise.all(
//       //   serverGroup.map(async group => {
//       //     try {
//       //       const captchaToken = await this.getCaptchaToken(url, captchaKey);

//       //       let res = await axios.get(
//       //         `${this.baseUrl}ajax/embed/play?id=${group.serverId}&_token=${captchaToken}`,
//       //         {
//       //           headers: {
//       //             referer: url,
//       //           },
//       //         }
//       //       );
//       //       return epsiodeServers.push({
//       //         name: group.serverName,
//       //         url: res.data.link,
//       //       });
//       //     } catch (error) {
//       //       return Promise.resolve();
//       //     }
//       //   })
//       // );

//       return epsiodeServers;
//     } catch (err) {
//       throw new Error((err as Error).message);
//     }
//   }

//   /**
//    *
//    * @param tmdbId tmdb id
//    * @param type 'movie' or 'tv'
//    * @param season season number
//    * @param episode episode number
//    * @param server server type (default `Vizcloud`) (optional)
//    */
//   override async fetchEpisodeSources(
//     tmdbId: string,
//     type: MediaFormat,
//     season?: number,
//     episode?: number,
//     server: StreamingServers = StreamingServers.VidCloud
//   ): Promise<ISource> {
//     if (tmdbId.startsWith('http')) {
//       console.log(tmdbId);
//       const serverUrl = new URL(tmdbId);
//       switch (server) {
//         case StreamingServers.VidCloud:
//           return {
//             headers: { Referer: serverUrl.href },
//             ...(await new VidCloud().extract(serverUrl, true)),
//           };
//         case StreamingServers.MixDrop:
//           return {
//             headers: { Referer: serverUrl.href },
//             sources: await new MixDrop().extract(serverUrl),
//           };
//         default:
//           return {
//             headers: { Referer: serverUrl.href },
//             ...(await new VidCloud().extract(serverUrl, true)),
//           };
//       }
//     }

//     try {
//       const servers = await this.fetchEpisodeServers(tmdbId, type, season, episode);
//       const selectedServer = servers.find(s => s.name === server);

//       if (!selectedServer) {
//         throw new Error(`Server ${server} not found`);
//       }

//       return await this.fetchEpisodeSources(selectedServer.url, type, season, episode, server);
//     } catch (err) {
//       throw new Error((err as Error).message);
//     }
//   }

//   private async getCaptchaToken(url: string, key: string) {
//     const uri = new URL(url);
//     const domain = new TextEncoder().encode(`${uri.protocol}//${uri.hostname}:443`);
//     const domainEncoded = Buffer.from(domain)
//       .toString('base64')
//       .replace(/\+/g, '-')
//       .replace(/\//g, '_')
//       .replace(/=+$/, '');

//     const recaptcha_out: string = await axios
//       .get('https://www.google.com/recaptcha/api.js?render=' + key)
//       .then(res => res.data);

//     const v_token = recaptcha_out.substring(
//       recaptcha_out.indexOf('/releases/') + 10,
//       recaptcha_out.indexOf('/recaptcha__en.js')
//     );

//     const anchor_out = await axios
//       .get(
//         `https://www.google.com/recaptcha/api2/anchor?ar=1&hl=en&size=invisible&cb=flicklax&k=${key}&co=${domainEncoded}&v=${v_token}`
//       )
//       .then(res => res.data);

//     const $ = load(anchor_out);

//     const recaptcha_token = $('#recaptcha-token').attr('value');

//     const data = {
//       v: v_token,
//       reason: 'q',
//       k: key,
//       c: recaptcha_token,
//       sa: '',
//       co: domainEncoded,
//     };

//     const token_out = await axios
//       .post(`https://www.google.com/recaptcha/api2/reload?k=${key}`, qs.stringify(data), {
//         headers: { referer: 'https://www.google.com/recaptcha/api2/' },
//       })
//       .then(res => res.data);

//     var token = token_out.match('rresp","(.+?)"');

//     return token[1];
//   }
// }

// export default VidSrc;
