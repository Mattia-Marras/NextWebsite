import {
    getCasinoPlayerStats,
} from "./casino";

import {
    getPlayerCosmetics,
} from "./cosmetics";

import {
    getLeaguePlayerStats,
    getLeagues,
} from "./leagues";

import {
    getPlayerProfile,
} from "./profiles";

import {
    getRankedProfile,
} from "./ranked";

import type {
    NextFootballPlayerPage,
    PlayerLeagueProfile,
} from "./types";

/*
 * Restituisce tutti i dati necessari alla pagina pubblica
 * di un singolo giocatore NextFootball.
 *
 * Il giocatore viene identificato tramite UUID.
 */

export async function getNextFootballPlayerPage(
    uuid: string,
): Promise<NextFootballPlayerPage | null> {
    /*
     * Il profilo principale determina se il giocatore
     * esiste realmente nel database NextFootball.
     */
    const profile = await getPlayerProfile(uuid);

    if (!profile) {
        return null;
    }

    /*
     * Le query indipendenti vengono eseguite in parallelo.
     */
    const [
        ranked,
        casino,
        cosmetics,
        leagues,
    ] = await Promise.all([
        getRankedProfile(profile.uuid),
        getCasinoPlayerStats(profile.uuid),
        getPlayerCosmetics(profile.uuid),
        getLeagues(),
    ]);

    /*
     * Al momento leagues.ts richiede un leagueId.
     *
     * Recuperiamo quindi le statistiche del giocatore
     * in tutte le leghe disponibili.
     */
    const leagueResults = await Promise.all(
        leagues.map(async (league) => {
            const statistics = await getLeaguePlayerStats(
                league.id,
                profile.uuid,
            );

            if (!statistics) {
                return null;
            }

            const result: PlayerLeagueProfile = {
                leagueId: league.id,
                leagueName: league.name,
                statistics,
            };

            return result;
        }),
    );

    const playerLeagues = leagueResults.filter(
        (
            league,
        ): league is PlayerLeagueProfile => league !== null,
    );

    return {
        profile,
        ranked,
        leagues: playerLeagues,
        casino,
        cosmetics,
    };
}

/*
 * Alias più breve, utile per route e servizi.
 */

export async function getPlayerPage(
    uuid: string,
): Promise<NextFootballPlayerPage | null> {
    return getNextFootballPlayerPage(uuid);
}
