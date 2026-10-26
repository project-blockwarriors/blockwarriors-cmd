import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import authModule from '../packages/backend/convex/auth.ts';
const { authComponent } = authModule;
import teams from '../packages/backend/convex/teams.ts';
import tournaments from '../packages/backend/convex/tournaments.ts';
import tournamentMatches from '../packages/backend/convex/tournamentMatches.ts';
const { createTournamentGame, createTournamentGameForServer } =
  tournamentMatches;

const protectedFunctions = [
  teams.joinTeam,
  teams.cancelJoinRequest,
  teams.getJoinRequestForTeam,
  teams.getTeamJoinRequests,
  teams.respondToJoinRequest,
  tournaments.joinTournament,
  tournaments.leaveTournament,
  createTournamentGame,
];

test('protected operations reject unauthenticated and impersonated user IDs before database access', async () => {
  const auth = mock.method(authComponent, 'getAuthUser', async () => null);
  try {
    for (const operation of protectedFunctions) {
      await assert.rejects(
        operation._handler({}, { userId: 'victim' }),
        /Unauthorized/
      );
    }
    auth.mock.mockImplementation(async () => ({ _id: 'attacker' }));
    for (const operation of protectedFunctions) {
      await assert.rejects(
        operation._handler({}, { userId: 'victim' }),
        /Unauthorized/
      );
    }
  } finally {
    auth.mock.restore();
  }
});

test('omitting userId still checks the authenticated user’s team', async () => {
  const auth = mock.method(authComponent, 'getAuthUser', async () => ({
    _id: 'outsider',
  }));
  let queriedUserId;
  const index = {
    eq(field, value) {
      queriedUserId = value;
      return this;
    },
  };
  const ctx = {
    db: {
      get: async () => ({ team1_id: 'team1', team2_id: 'team2' }),
      query: () => ({
        withIndex: (_name, callback) => {
          callback(index);
          return { first: async () => ({ team_id: 'team3' }) };
        },
      }),
    },
  };
  try {
    const result = await createTournamentGame._handler(ctx, {
      tournamentMatchId: 'match',
      matchType: 'pvp',
      mode: 'ranked',
    });
    assert.equal(queriedUserId, 'outsider');
    assert.equal(result.success, false);
    assert.match(result.error, /your team's matches/);
  } finally {
    auth.mock.restore();
  }
});

test('authenticated participants and the internal server route can create games', async () => {
  const auth = mock.method(authComponent, 'getAuthUser', async () => ({
    _id: 'member',
  }));
  const match = {
    team1_id: 'team1',
    team2_id: 'team2',
    round: 1,
    games: [],
    games_required: 1,
    team1_games_won: 0,
    team2_games_won: 0,
    status: 'pending',
  };
  const index = {
    eq() {
      return this;
    },
  };
  const ctx = {
    db: {
      get: async () => match,
      query: () => ({
        withIndex: (_name, callback) => {
          callback(index);
          return {
            first: async () => ({ team_id: 'team1' }),
            collect: async () => [],
          };
        },
      }),
      insert: async (table) => (table === 'matches' ? 'game' : 'game-team'),
      patch: async () => {},
    },
  };
  try {
    const args = {
      tournamentMatchId: 'match',
      matchType: 'pvp',
      mode: 'ranked',
    };
    assert.equal(
      (await createTournamentGame._handler(ctx, args)).success,
      true
    );
    assert.equal(createTournamentGameForServer.isInternal, true);
    assert.equal(
      (await createTournamentGameForServer._handler(ctx, args)).success,
      true
    );
  } finally {
    auth.mock.restore();
  }
});
