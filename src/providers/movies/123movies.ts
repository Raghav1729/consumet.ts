import { load } from 'cheerio';
import axios from 'axios';
import qs from 'qs';
import {
  MovieParser,
  TvType,
  IMovieInfo,
  IEpisodeServer,
  StreamingServers,
  ISource,
  IMovieResult,
  ISearch,
  MediaFormat,
} from '../../models';
import { MixDrop, VidCloud } from '../../extractors';

class Movie123 extends MovieParser {
  override readonly name = 'Movie123';
  protected override baseUrl = 'https://api.123movie.cc';
  protected override logo = 'https://s1.bunnycdn.ru/assets/sites/fmovies/logo2.png';
  protected override classPath = 'MOVIES.TwoEmbed';
  override supportedTypes = new Set([TvType.MOVIE, TvType.TVSERIES]);

  override search(mediaLink: string, ...args: any): Promise<ISearch<IMovieResult>> {
    throw new Error('Method not implemented. Use META.TMDB to fetch data.');
  }

  override fetchMediaInfo(mediaId: string, ...args: any): Promise<IMovieInfo> {
    throw new Error('Method not implemented. Use META.TMDB to fetch data.');
  }

  /**
   *
   * @param tmdbId tmdb id
   * @param type 'movie' or 'tv'
   * @param season season number
   * @param episode episode number
   */
  override async fetchEpisodeServers(
    tmdbId: string,
    type: MediaFormat,
    season?: number,
    episode?: number
  ): Promise<IEpisodeServer[]> {
    try {
      const epsiodeServers: IEpisodeServer[] = [];

      const url =
        type.toLowerCase() === 'movie'
          ? `${this.baseUrl}/tmdb_api.php?id=${tmdbId}`
          : type.toLowerCase() === 'tv'
          ? `${this.baseUrl}/tmdb_api.php?tmdb=${tmdbId}&se=${season}&ep=${episode}&server_name=vcu/`
          : '';

      let res = await axios.get(url, {
        timeout: 3000,
      });
      const $ = load(res.data);

      const iframeSrc = $('iframe').attr('src');

      if (!iframeSrc) {
        throw new Error('No stream found');
      }

      console.log(!iframeSrc);

      let iframeDocument;

      try {
        iframeDocument = await axios.get(iframeSrc, {
          headers: {
            Referer: this.baseUrl,
          },
        });
      } catch (err) {
        throw new Error('No stream found');
      }
      const captchaKey = $('[data-recaptcha-key]').attr('data-recaptcha-key');

      if (!captchaKey) {
        throw new Error('2Embed movies series ');
      }

      return epsiodeServers;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  /**
   *
   * @param tmdbId tmdb id
   * @param type 'movie' or 'tv'
   * @param season season number
   * @param episode episode number
   * @param server server type (default `Vizcloud`) (optional)
   */
  override async fetchEpisodeSources(
    tmdbId: string,
    type: MediaFormat,
    season?: number,
    episode?: number,
    server: StreamingServers = StreamingServers.VidCloud
  ): Promise<ISource> {
    if (tmdbId.startsWith('http')) {
      console.log(tmdbId);
      const serverUrl = new URL(tmdbId);
      switch (server) {
        case StreamingServers.VidCloud:
          return {
            headers: { Referer: serverUrl.href },
            ...(await new VidCloud().extract(serverUrl, true)),
          };
        case StreamingServers.MixDrop:
          return {
            headers: { Referer: serverUrl.href },
            sources: await new MixDrop().extract(serverUrl),
          };
        default:
          return {
            headers: { Referer: serverUrl.href },
            ...(await new VidCloud().extract(serverUrl, true)),
          };
      }
    }

    try {
      const servers = await this.fetchEpisodeServers(tmdbId, type, season, episode);
      const selectedServer = servers.find(s => s.name === server);

      if (!selectedServer) {
        throw new Error(`Server ${server} not found`);
      }

      return await this.fetchEpisodeSources(selectedServer.url, type, season, episode, server);
    } catch (err) {
      throw new Error((err as Error).message);
    }
  }

  private async getCaptchaToken(url: string, key: string) {
    const uri = new URL(url);
    const domain = new TextEncoder().encode(`${uri.protocol}//${uri.hostname}:443`);
    const domainEncoded = Buffer.from(domain)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const recaptcha_out: string = await axios
      .get('https://www.google.com/recaptcha/api.js?render=' + key)
      .then(res => res.data);

    const v_token = recaptcha_out.substring(
      recaptcha_out.indexOf('/releases/') + 10,
      recaptcha_out.indexOf('/recaptcha__en.js')
    );

    const anchor_out = await axios
      .get(
        `https://www.google.com/recaptcha/api2/anchor?ar=1&hl=en&size=invisible&cb=flicklax&k=${key}&co=${domainEncoded}&v=${v_token}`
      )
      .then(res => res.data);

    const $ = load(anchor_out);

    const recaptcha_token = $('#recaptcha-token').attr('value');

    const data = {
      v: v_token,
      reason: 'q',
      k: key,
      c: recaptcha_token,
      sa: '',
      co: domainEncoded,
    };

    const token_out = await axios
      .post(`https://www.google.com/recaptcha/api2/reload?k=${key}`, qs.stringify(data), {
        headers: { referer: 'https://www.google.com/recaptcha/api2/' },
      })
      .then(res => res.data);

    var token = token_out.match('rresp","(.+?)"');

    return token[1];
  }
}

export default TwoEmbed;
