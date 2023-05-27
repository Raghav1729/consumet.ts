import { CheerioAPI, load } from 'cheerio';
import axios from 'axios';
import { substringAfter, substringBeforeLast } from '../../utils/utils';

import {
  MovieParser,
  TvType,
  IMovieInfo,
  IEpisodeServer,
  StreamingServers,
  ISource,
  IMovieResult,
  ISearch,
  IMovieEpisode,
  ProxyConfig,
} from '../../models';
import { MixDrop, StreamTape, VidCloud, VizCloud } from '../../extractors';
import { error } from 'console';

let cloudscraper: any;

class HDWatched extends MovieParser {
  override readonly name = 'HDWatched';
  protected override baseUrl = 'https://www.hdwatched.xyz';
  protected override logo = 'https://s1.bunnycdn.ru/assets/sites/fmovies/logo2.png';
  protected override classPath = 'MOVIES.Fmovies';
  override supportedTypes = new Set([TvType.MOVIE, TvType.TVSERIES]);

  constructor() {
    try {
      cloudscraper = require('cloudscraper');
    } catch (err: any) {
      if (err.message.includes("Cannot find module 'request'")) {
        throw new Error(
          'Request is not installed. Please install it by running "npm i request" or "yarn add request"'
        );
      } else if (err.message.includes("Cannot find module 'cloudscraper'")) {
        throw new Error(
          'Cloudscraper is not installed. Please install it by running "npm i cloudscraper" or "yarn add cloudscraper"'
        );
      } else {
        throw new Error((err as Error).message);
      }
    }

    super();
  }

  /**
   *
   * @param imdbID search query string or imdb id
   * @param page page number (default 1) (optional)
   */
  override search = async (imdbID: string, page: number = 1): Promise<ISearch<IMovieResult>> => {
    try {
      const searchResult: ISearch<IMovieResult> = {
        currentPage: page,
        hasNextPage: false,
        results: [],
      };

      const options = {
        method: 'GET',
        url: `${this.baseUrl}/search/${imdbID.replace(/[\W_]+/g, '-')}?page=${page}`,
        headers: {
          'User-Agent': 'Ubuntu Chromium/34.0.1847.116 Chrome/34.0.1847.116 Safari/537.36',
          'Cache-Control': 'private',
          Accept:
            'application/xml,application/xhtml+xml,text/html;q=0.9, text/plain;q=0.8,image/png,*/*;q=0.5',
        },
        cloudflareTimeout: 5000,
        cloudflareMaxTimeout: 30000,
        followAllRedirects: true,
        challengesToSolve: 3,
        decodeEmails: false,
        gzip: true,
      };

      const data: string = await cloudscraper(options).then((response: any) => response);
      const $: CheerioAPI = load(data);

      searchResult.hasNextPage = ($('ul.pagination > li > a').last().attr('title') || '') === 'next page';

      $('div.i-container')
        .toArray()
        .forEach((element: any) => {
          searchResult.results.push({
            id: $(element).find('a').attr('href') || '',
            title: $(element).find('span.content-title').text(),
            url: `${this.baseUrl}${$(element).find('a').attr('href')}`,
            releaseDate: $(element).find('div.duration').text().trim().split(' ').pop(),
            image: $(element).find('div.thumb-overlay > img').attr('src'),
            type: ($(element).find('a').attr('href') || '').includes('free') ? TvType.MOVIE : TvType.TVSERIES,
          });
        });

      return searchResult;
    } catch (err) {
      console.log(err);
      throw new Error((err as Error).message);
    }
  };

  /**
   *
   * @param mediaId media link or id
   */
  override fetchMediaInfo = async (mediaId: string): Promise<IMovieInfo> => {
    if (!mediaId.startsWith(this.baseUrl)) {
      mediaId = `${this.baseUrl}${mediaId}`;
    }
    throw new Error('Method not implemented.');
    // try {
    //   const movieInfo: IMovieInfo = {
    //     id: mediaId,
    //     title: '',
    //     url: mediaId,
    //   };

    //   const options = {
    //     method: 'GET',
    //     url: mediaId,
    //     headers: {
    //       'User-Agent': 'Ubuntu Chromium/34.0.1847.116 Chrome/34.0.1847.116 Safari/537.36',
    //       'Cache-Control': 'private',
    //       Accept:
    //         'application/xml,application/xhtml+xml,text/html;q=0.9, text/plain;q=0.8,image/png,*/*;q=0.5',
    //     },
    //     cloudflareTimeout: 5000,
    //     cloudflareMaxTimeout: 30000,
    //     followAllRedirects: true,
    //     challengesToSolve: 3,
    //     decodeEmails: false,
    //     gzip: true,
    //   };

    //   const data: string = await cloudscraper(options).then((response: any) => response);
    //   const $: CheerioAPI = load(data);

    //   return movieInfo;
    // } catch (err) {
    //   console.log(err);
    //   throw new Error((err as Error).message);
    // }
  };

  /**
   *
   * @param episodeId episode id
   * @param mediaId media id
   * @param server server type (default `VidCloud`) (optional)
   */
  override fetchEpisodeSources = async (
    episodeId: string,
    mediaId: string,
    server: StreamingServers = StreamingServers.UpCloud
  ): Promise<ISource> => {
    // if (episodeId.startsWith('http')) {
    //   const serverUrl = new URL(episodeId);
    //   switch (server) {
    //     case StreamingServers.MixDrop:
    //       return {
    //         headers: { Referer: serverUrl.href },
    //         sources: await new MixDrop().extract(serverUrl),
    //       };
    //     case StreamingServers.VidCloud:
    //       return {
    //         headers: { Referer: serverUrl.href },
    //         ...(await new VidCloud().extract(serverUrl, true)),
    //       };
    //     case StreamingServers.UpCloud:
    //       return {
    //         headers: { Referer: serverUrl.href },
    //         ...(await new VidCloud().extract(serverUrl)),
    //       };
    //     default:
    //       return {
    //         headers: { Referer: serverUrl.href },
    //         sources: await new MixDrop().extract(serverUrl),
    //       };
    //   }
    // }

    try {
      const servers = await this.fetchEpisodeServers(episodeId, mediaId);

      const i = servers.findIndex(s => s.name === server);

      if (i === -1) {
        throw new Error(`Server ${server} not found`);
      }

      const { data } = await axios.get(
        `${this.baseUrl}/ajax/get_link/${servers[i].url.split('.').slice(-1).shift()}`
      );

      const serverUrl: URL = new URL(data.link);

      return await this.fetchEpisodeSources(serverUrl.href, mediaId, server);
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  /**
   *
   * @param episodeId takes episode link or movie id
   * @param mediaId takes movie link or id (found on movie info object)
   */
  override fetchEpisodeServers = async (episodeId: string, mediaId: string): Promise<IEpisodeServer[]> => {
    // if (!episodeId.startsWith(this.baseUrl + '/ajax') && !mediaId.includes('movie'))
    //   episodeId = `${this.baseUrl}/ajax/v2/episode/servers/${episodeId}`;
    // else episodeId = `${this.baseUrl}/ajax/movie/episodes/${episodeId}`;

    try {
      const options = {
        method: 'GET',
        url: this.baseUrl + mediaId,
        headers: {
          'User-Agent': 'Ubuntu Chromium/34.0.1847.116 Chrome/34.0.1847.116 Safari/537.36',
          'Cache-Control': 'private',
          Accept:
            'application/xml,application/xhtml+xml,text/html;q=0.9, text/plain;q=0.8,image/png,*/*;q=0.5',
        },
        cloudflareTimeout: 5000,
        cloudflareMaxTimeout: 30000,
        followAllRedirects: true,
        challengesToSolve: 3,
        decodeEmails: false,
        gzip: true,
      };

      const data: string = await cloudscraper(options).then((response: any) => response);
      const $: CheerioAPI = load(data);

      const streamSrc = $.html();
      console.log(streamSrc);
      const streamRes = $('video#vjsplayer > source').attr('res');

      console.log(streamRes);

      if (!streamSrc || !streamRes) throw new Error('No stream found');

      // return {
      //   url: streamSrc,
      //   quality: parseInt(streamRes),
      // };
      // const servers = $('.nav > li')
      //   .map((i: any, el: any) => {
      //     const server = {
      //       name: mediaId.includes('movie')
      //         ? $(el).find('a').attr('title')!.toLowerCase()
      //         : $(el).find('a').attr('title')!.slice(6).trim().toLowerCase(),
      //       url: `${this.baseUrl}/${mediaId}.${
      //         !mediaId.includes('movie')
      //           ? $(el).find('a').attr('data-id')
      //           : $(el).find('a').attr('data-linkid')
      //       }`.replace(
      //         !mediaId.includes('movie') ? /\/tv\// : /\/movie\//,
      //         !mediaId.includes('movie') ? '/watch-tv/' : '/watch-movie/'
      //       ),
      //     };
      //     return server;
      //   })
      //   .get();
      return [];
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };
}

function getStreamFromEmbed(stream: string) {
  const embedPage = load(stream);
  const source = embedPage('#vjsplayer > source');
  if (!source) {
    throw new Error('No stream found');
  }

  const streamSrc = source.attr('src');
  const streamRes = source.attr('res');

  if (!streamSrc || !streamRes) throw new Error('No stream found');

  return {
    url: streamSrc,
    quality: parseInt(streamRes),
  };
}

// async function fetchMovie({ id }: { id: number }) {
// 	const stream = await ofetch(`/embed/${id}`, {
// 		baseURL: BASE_URL,
// 	});

// 	const embedPage = load(stream);
// 	const source = embedPage('#vjsplayer > source');
// 	if (!source) {
// 		throw new Error('No stream found');
// 	}

// 	return getStreamFromEmbed(stream);
// }

// async function fetchSeries({
// 	setProgress,
// 	href,
// 	season,
// 	episode,
// }: {
// 	setProgress: Progress;
// 	href: string;
// 	season: number;
// 	episode: number;
// }) {
// 	const seriesPage = await ofetch(`${href}?season=${season}`, {
// 		baseURL: BASE_URL,
// 	});

// 	const seasonPage = load(seriesPage);
// 	const pageElements = seasonPage('div.i-container').toArray();

// 	const seriesList: {
// 		title: string;
// 		href: string;
// 		id: string;
// 	}[] = [];
// 	pageElements.forEach((pageElement) => {
// 		const href = seasonPage(pageElement).find('a')?.attr('href') || '';
// 		const title =
// 			seasonPage(pageElement).find('span.content-title')?.text() || '';

// 		if (!href || !title) {
// 			throw new Error('No stream found');
// 		}

// 		seriesList.push({
// 			title: title.toString(),
// 			href,
// 			id: href.split('/')[2], // Format: /free/{id}/{series-slug}-season-{season-number}-episode-{episode-number}
// 		});
// 	});

// 	const targetEpisode = seriesList.find(
// 		(episodeEl: any) =>
// 			episodeEl.title.trim().toLowerCase() === `episode ${episode}`
// 	);

// 	if (!targetEpisode) {
// 		throw new Error('No stream found');
// 	}

// 	setProgress(0.7);

// 	const stream = await ofetch(`/embed/${targetEpisode.id}`, {
// 		baseURL: BASE_URL,
// 	});

// 	const embedPage = load(stream);
// 	const source = embedPage('#vjsplayer > source');
// 	if (!source) {
// 		throw new Error('No stream found');
// 	}

// 	return getStreamFromEmbed(stream);
// }

// async function execute({
// 	titleInfo,
// 	setProgress,
// }: {
// 	titleInfo: TitleInfo;
// 	setProgress: Progress;
// }) {
// 	const search = await ofetch(`/search/${titleInfo.imdbID}`, {
// 		baseURL: BASE_URL,
// 	});

// 	const searchPage = load(search);
// 	const pageElements = searchPage('div.i-container').toArray();

// 	const searchList: any = [];
// 	pageElements.forEach((movieElement) => {
// 		const href = searchPage(movieElement).find('a').attr('href') || '';
// 		const title =
// 			searchPage(movieElement).find('span.content-title').text() || '';
// 		const year =
// 			parseInt(
// 				searchPage(movieElement)
// 					.find('div.duration')
// 					.text()
// 					.trim()
// 					.split(' ')
// 					.pop() || '',
// 				10
// 			) || 0;

// 		searchList.push({
// 			title,
// 			year,
// 			id: href.split('/')[2], // Format: /free/{id}}/{movie-slug} | Example: /free/18804/iron-man-231
// 			href: href,
// 		});
// 	});

// 	setProgress(0.2);

// 	const targetSource = searchList.find(
// 		(source: any) => source.year === (titleInfo.year ? +titleInfo.year : 0)
// 	);

// 	if (!targetSource) {
// 		throw new Error('No stream found');
// 	}

// 	setProgress(0.4);

// 	if (titleInfo.type === MediaType.MOVIE) {
// 		const movie = await fetchMovie({
// 			id: targetSource.id,
// 		});

// 		if (!movie?.url || !movie?.quality) {
// 			throw new Error('No stream found');
// 		}

// 		return [
// 			{
// 				url: movie.url,
// 				quality: movie.quality,
// 			},
// 		];
// 	} else {
// 		const series = await fetchSeries({
// 			setProgress,
// 			href: targetSource.href,
// 			season: titleInfo.season ?? 1,
// 			episode: titleInfo.episode ?? 1,
// 		});

// 		if (!series?.url || !series?.quality) {
// 			throw new Error('No stream found');
// 		}

// 		return [
// 			{
// 				url: series.url,
// 				quality: series.quality,
// 			},
// 		];
// 	}
// }

export default HDWatched;
