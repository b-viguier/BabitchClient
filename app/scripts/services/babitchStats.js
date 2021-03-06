/* global _ */
/* jshint camelcase: false */
'use strict';

angular.module('babitchFrontendApp')
    .service('babitchStats', function babitchStats(Restangular, $q, CONFIG) {
        // AngularJS will instantiate a singleton by calling 'new' on this function
        var stats = {
            minGamePlayedPlayers: 1,
            minGamePlayedTeams: 1,
            playersList: [],
            teamList: [],
            gamesList: [],
            statsPlayers: [],
            statsPlayersFiltered: [],
            statsTeams: [],
            statsTeamsFiltered: [],
            matrix: {
                'nodes': [],
                'whoPlayedWithWho': [],
                'whoPlayedAgainstWho': [],
                'whoBeatWho': []
            },
            statsType: [
                {
                    name: 'eloRanking',
                    desc: 'Elo Ranking',
                    team: true
                },
                {
                    name: 'percentGoalPerBall',
                    text: '%Goal',
                    addSuffix: '%',
                    desc : 'Percentage of goal per ball played',
                    team: true
                },
                {
                    name: 'avgGoalPerGame',
                    text: 'Goal/Game',
                    desc: 'Average goal the player made per game',
                    team: true
                },
                {
                    name: 'percentVictory',
                    text: '%Victory',
                    addSuffix: '%',
                    desc: 'Percentage of victory',
                    team: true
                },
                {
                    name: 'percentLoose',
                    text: '%Loose',
                    addSuffix: '%',
                    desc: 'Percentage of loose',
                    team: true
                },
                {
                    name: 'gamePlayed',
                    text: 'game Played',
                    desc: 'Number of game played',
                    team: true
                },
                {
                    name: 'teamGoalaverage',
                    text: 'team Goalaverage',
                    desc: 'Team Goalaverage : goal of his team - goal concede',
                    team: true
                },
                {
                    name: 'ballsPlayed',
                    text: 'balls Played',
                    desc: 'Total number of balls played',
                    team: true
                },
                {
                    name: 'percentDefense',
                    text: '%Defense',
                    addSuffix: '%',
                    desc: 'Percentage of balls played in defense',
                    team: false
                },
                {
                    name: 'percentAttack',
                    text: '%Attack',
                    addSuffix: '%',
                    desc: 'Percentage of balls played in attack',
                    team: false
                },
                {
                    name: 'percentGoalPerBallinAttack',
                    text: '%Goal Attack',
                    addSuffix: '%',
                    desc: 'Percentage of goal per ball played in attack',
                    team: true
                },
                {
                    name: 'percentGoalPerBallinDefense',
                    text: '%Goal Defense',
                    addSuffix: '%',
                    desc: 'Percentage of goal per ball played in defense',
                    team: true
                }
            ]
        };

        var _redTeamId;
        var _blueTeamId;

        var _setGameComposition = function(game) {
            game.composition.forEach(function(compo) {
                if (compo.team === 'red') {
                    if (compo.position === 'attack') {
                        game.redAttack = compo.player_id;
                        game.redAttackFakeId = stats.statsPlayers[compo.player_id].fakeId;
                    } else {
                        game.redDefense = compo.player_id;
                        game.redDefenseFakeId = stats.statsPlayers[compo.player_id].fakeId;
                    }
                } else {
                    if (compo.position === 'attack') {
                        game.blueAttack = compo.player_id;
                        game.blueAttackFakeId = stats.statsPlayers[compo.player_id].fakeId;
                    } else {
                        game.blueDefense = compo.player_id;
                        game.blueDefenseFakeId = stats.statsPlayers[compo.player_id].fakeId;
                    }
                }
            });

        };

        var _setStatsVictoryLoose = function(game) {
            if (game.red_score === 10) {
                stats.statsPlayers[game.redAttack].victory++;
                stats.statsPlayers[game.redDefense].victory++;
                stats.statsPlayers[game.blueAttack].loose++;
                stats.statsPlayers[game.blueDefense].loose++;

                stats.statsTeams[_redTeamId].victory++;
                stats.statsTeams[_blueTeamId].loose++;

                stats.statsPlayers[game.redAttack].gameSeries.push('W');
                stats.statsPlayers[game.redDefense].gameSeries.push('W');
                stats.statsPlayers[game.blueAttack].gameSeries.push('L');
                stats.statsPlayers[game.blueDefense].gameSeries.push('L');
            } else {
                stats.statsPlayers[game.redAttack].loose++;
                stats.statsPlayers[game.redDefense].loose++;
                stats.statsPlayers[game.blueAttack].victory++;
                stats.statsPlayers[game.blueDefense].victory++;

                stats.statsTeams[_redTeamId].loose++;
                stats.statsTeams[_blueTeamId].victory++;

                stats.statsPlayers[game.redAttack].gameSeries.push('L');
                stats.statsPlayers[game.redDefense].gameSeries.push('L');
                stats.statsPlayers[game.blueAttack].gameSeries.push('W');
                stats.statsPlayers[game.blueDefense].gameSeries.push('W');
            }
        };

        var _setStatsPercentVictoryLoose = function(type, id) {
            if(stats['stats' + type][id].gamePlayed) {
                stats['stats' + type][id].percentVictory = +(stats['stats' + type][id].victory / stats['stats' + type][id].gamePlayed * 100).toFixed(1);
                stats['stats' + type][id].percentLoose = +(stats['stats' + type][id].loose / stats['stats' + type][id].gamePlayed * 100).toFixed(1);
            }
        };

        var _setStatsPercentPosition = function(type, id) {
            if(stats['stats' + type][id].gamePlayed) {
                stats['stats' + type][id].percentAttack = +(stats['stats' + type][id].ballsPlayedAttack / stats['stats' + type][id].ballsPlayed * 100).toFixed(1);
                stats['stats' + type][id].percentDefense = +(stats['stats' + type][id].ballsPlayedDefense / stats['stats' + type][id].ballsPlayed * 100).toFixed(1);
            }
        };

        var _setStatsEloRanking = function(game) {
            var redWins, blueWins;
            if(game.red_score === 10) {
                redWins = 1;
                blueWins = 0;
            }
            else {
                redWins = 0;
                blueWins = 1;
            }

            stats.statsTeams[_redTeamId].eloRanking = (stats.statsPlayers[game.redAttack].eloRanking + stats.statsPlayers[game.redDefense].eloRanking) / 2;
            stats.statsTeams[_blueTeamId].eloRanking = (stats.statsPlayers[game.blueAttack].eloRanking + stats.statsPlayers[game.blueDefense].eloRanking) / 2;

            //Diff in ranking between blue and redteam
            var redDiff = (stats.statsTeams[_blueTeamId].eloRanking - stats.statsTeams[_redTeamId].eloRanking);

            //Calculate Red and Blue Win Expectancy
            var RedWe = +(1 / ( Math.pow(10, ( redDiff / 1000)) + 1 )).toFixed(2);
            var BlueWe = +(1 - RedWe).toFixed(2);

            var KFactor = 50;

            var redNewEloRanking = stats.statsTeams[_redTeamId].eloRanking + (KFactor * ( redWins - RedWe));
            var redRanking = +(redNewEloRanking - stats.statsTeams[_redTeamId].eloRanking).toFixed(0);
            stats.statsTeams[_redTeamId].eloRanking = redNewEloRanking;

            stats.statsPlayers[game.redAttack].eloRanking += redRanking;
            stats.statsPlayers[game.redDefense].eloRanking += redRanking;

            var blueNewEloRanking = stats.statsTeams[_blueTeamId].eloRanking + (KFactor * ( blueWins - BlueWe));
            var blueRanking = +(blueNewEloRanking - stats.statsTeams[_blueTeamId].eloRanking).toFixed(0);
            stats.statsTeams[_blueTeamId].eloRanking = blueNewEloRanking;

            stats.statsPlayers[game.blueAttack].eloRanking += blueRanking;
            stats.statsPlayers[game.blueDefense].eloRanking += blueRanking;

            game.redEloTeam = stats.statsTeams[_redTeamId].eloRanking;
            game.blueEloTeam = stats.statsTeams[_blueTeamId].eloRanking;
            game.redEloWins = redRanking;
            game.blueEloWins = blueRanking;

        };

        var _setStatsPercentGoal = function(type, id) {
            if(stats['stats' + type][id].ballsPlayed) {
                stats['stats' + type][id].percentGoalPerBall = +(stats['stats' + type][id].goal / stats['stats' + type][id].ballsPlayed * 100).toFixed(1);
                stats['stats' + type][id].percentGoalPerBallinAttack = +(stats['stats' + type][id].goalAttack / stats['stats' + type][id].ballsPlayedAttack * 100).toFixed(1);
                stats['stats' + type][id].percentGoalPerBallinDefense = +(stats['stats' + type][id].goalDefense / stats['stats' + type][id].ballsPlayedDefense * 100).toFixed(1);
            }
            if(stats['stats' + type][id].gamePlayed) {
                stats['stats' + type][id].avgGoalPerGame = +(stats['stats' + type][id].goal / (stats['stats' + type][id].gamePlayed * 10) * 10).toFixed(1);
            }
        };

        var _setStatsGamePlayed = function(game) {
            stats.statsPlayers[game.redAttack].gamePlayed++;
            stats.statsPlayers[game.redDefense].gamePlayed++;
            stats.statsPlayers[game.blueAttack].gamePlayed++;
            stats.statsPlayers[game.blueDefense].gamePlayed++;

            stats.statsTeams[_redTeamId].gamePlayed++;
            stats.statsTeams[_blueTeamId].gamePlayed++;
        };

        var _setStatsTeamGoalaverage = function(game) {
            stats.statsPlayers[game.redAttack].teamGoalaverage += game.red_score;
            stats.statsPlayers[game.redAttack].teamGoalaverage -= game.blue_score;
            stats.statsPlayers[game.redDefense].teamGoalaverage += game.red_score;
            stats.statsPlayers[game.redDefense].teamGoalaverage -= game.blue_score;

            stats.statsPlayers[game.blueAttack].teamGoalaverage += game.blue_score;
            stats.statsPlayers[game.blueAttack].teamGoalaverage -= game.red_score;
            stats.statsPlayers[game.blueDefense].teamGoalaverage += game.blue_score;
            stats.statsPlayers[game.blueDefense].teamGoalaverage -= game.red_score;

            stats.statsTeams[_redTeamId].teamGoalaverage += game.red_score;
            stats.statsTeams[_redTeamId].teamGoalaverage -= game.blue_score;
            stats.statsTeams[_blueTeamId].teamGoalaverage -= game.red_score;
            stats.statsTeams[_blueTeamId].teamGoalaverage += game.blue_score;
        };

        var _setStatsBallsPlayed = function(game) {
            stats.statsPlayers[game.redAttack].ballsPlayed++;
            stats.statsPlayers[game.redDefense].ballsPlayed++;
            stats.statsPlayers[game.blueAttack].ballsPlayed++;
            stats.statsPlayers[game.blueDefense].ballsPlayed++;

            stats.statsTeams[_redTeamId].ballsPlayed++;
            stats.statsTeams[_blueTeamId].ballsPlayed++;

            //For team it doesn't matter
            stats.statsTeams[_redTeamId].ballsPlayedAttack++;
            stats.statsTeams[_blueTeamId].ballsPlayedAttack++;
            stats.statsTeams[_redTeamId].ballsPlayedDefense++;
            stats.statsTeams[_blueTeamId].ballsPlayedDefense++;

            stats.statsPlayers[game.compositionLive.red.attack].ballsPlayedAttack++;
            stats.statsPlayers[game.compositionLive.blue.attack].ballsPlayedAttack++;
            stats.statsPlayers[game.compositionLive.red.defense].ballsPlayedDefense++;
            stats.statsPlayers[game.compositionLive.blue.defense].ballsPlayedDefense++;

        };

        //Define which team color have goaled
        var _setTeamGoal = function(game, goal) {
            switch (goal.player_id) {
                case game.redDefense:
                case game.redAttack:
                    goal.team = 'red';
                    break;
                case game.blueDefense:
                case game.blueAttack:
                    goal.team = 'blue';
                    break;
            }
        };

        var _setBallComposition = function(game, goal) {
            //if composition not setted yet
            if(!game.compositionLive) {
                game.compositionLive = {
                    red: {
                        defense: game.redDefense,
                        attack: game.redAttack
                    },
                    blue: {
                        defense: game.blueDefense,
                        attack: game.blueAttack
                    }
                };
            }

            //if a coaching has been made
            // If the goaler is not the one previously at this position, invert them
            if(game.compositionLive[goal.team][goal.position] !== goal.player_id && !goal.autogoal) {
                var tmpPlayer = game.compositionLive[goal.team][(goal.position === 'defense' ? 'attack' : 'defense')];
                game.compositionLive[goal.team][(goal.position === 'defense' ? 'attack' : 'defense')] = game.compositionLive[goal.team][goal.position];
                game.compositionLive[goal.team][goal.position] = tmpPlayer;
            }

            //if the defender is not the one taking the goal (on an autogoal), invert them
            if(game.compositionLive[goal.team].defense !== goal.conceder_id && goal.autogoal ) {
                //Invert players
                game.compositionLive[goal.team].attack = game.compositionLive[goal.team].defense;
                game.compositionLive[goal.team].defense = goal.conceder_id;
            }

            //if the defender is not the one taking the goal (not an autogoal), invert them
            if(game.compositionLive[(goal.team === 'red' ? 'blue' : 'red')].defense !== goal.conceder_id && !goal.autogoal ) {
                //Invert players
                game.compositionLive[(goal.team === 'red' ? 'blue' : 'red')].attack = game.compositionLive[(goal.team === 'red' ? 'blue' : 'red')].defense;
                game.compositionLive[(goal.team === 'red' ? 'blue' : 'red')].defense = goal.conceder_id;
            }
        };


        //Set min game play depending on numbers of game played
        var _setMinGamePlayed = function() {
            stats.minGamePlayedPlayers = (stats.gamesList.length * (CONFIG.BABITCH_STATS_MIN_GAME_PLAYED / 100)).toFixed(0);
            stats.minGamePlayedTeams = (stats.gamesList.length * (CONFIG.BABITCH_STATS_MIN_GAME_PLAYED / 100)).toFixed(0);
            if(stats.minGamePlayedPlayers <1 ) {
                stats.minGamePlayedPlayers = 1;
            }
            if(stats.minGamePlayedTeams <1 ) {
                stats.minGamePlayedTeams = 1;
            }
        };

        //Set Duration of each games
        var _setDuration = function(games) {
            if(games.started_at === null || games.ended_at === null) {
                games.duration = 0;
            }
            else {
                var ended_at = new Date(games.ended_at.replace(' ','T'));
                var started_at = new Date(games.started_at.replace(' ','T'));
                var game_length = (ended_at.getTime() - started_at.getTime()) / 1000;
                games.duration = game_length;
            }
        };

        //Add goal and owngoal for team and players
        var _setStatsGoalOwnGoal = function(goal) {
            if (goal.autogoal) {
                //Log autogoal for team
                if (goal.team === 'red') {
                    stats.statsTeams[_redTeamId].owngoal++;
                } else {
                    stats.statsTeams[_blueTeamId].owngoal++;
                }
                //Log autogoal for player
                stats.statsPlayers[goal.player_id].owngoal++;

                //Log autogoal by position
                if (goal.position === 'attack') {
                    stats.statsPlayers[goal.player_id].owngoalAttack++;
                    if (goal.team === 'red') {
                        stats.statsTeams[_redTeamId].owngoalAttack++;
                    } else {
                        stats.statsTeams[_blueTeamId].owngoalAttack++;
                    }
                } else if (goal.position === 'defense') {
                    stats.statsPlayers[goal.player_id].owngoalDefense++;
                    if (goal.team === 'red') {
                        stats.statsTeams[_redTeamId].owngoalDefense++;
                    } else {
                        stats.statsTeams[_blueTeamId].owngoalDefense++;
                    }
                }
            } else {
                //Log goal for team
                if (goal.team === 'red') {
                    stats.statsTeams[_redTeamId].goal++;
                } else {
                    stats.statsTeams[_blueTeamId].goal++;
                }
                //Log goal for player
                stats.statsPlayers[goal.player_id].goal++;
                if (goal.position === 'attack') {
                    stats.statsPlayers[goal.player_id].goalAttack++;
                    if (goal.team === 'red') {
                        stats.statsTeams[_redTeamId].goalAttack++;
                    } else {
                        stats.statsTeams[_blueTeamId].goalAttack++;
                    }
                } else if (goal.position === 'defense') {
                    stats.statsPlayers[goal.player_id].goalDefense++;
                    if (goal.team === 'red') {
                        stats.statsTeams[_redTeamId].goalDefense++;
                    } else {
                        stats.statsTeams[_blueTeamId].goalDefense++;
                    }
                }
            }
            stats.statsPlayers[goal.conceder_id].goalConcede++;

        };
        var _initPlayers = function() {
            //Fetch players
            Restangular.all('players').getList()
                .then(function(data) {
                    data.forEach(function(player) {
                        stats.playersList[player.id] = player;

                        //Init Stats of all numerical values
                        if (!stats.statsPlayers[player.id]) {
                            stats.statsPlayers[player.id] = {
                                name: player.name,
                                id: player.id,
                                goal: 0,
                                goalAttack: 0,
                                goalDefense: 0,
                                owngoal: 0,
                                owngoalAttack: 0,
                                owngoalDefense: 0,
                                victory: 0,
                                loose: 0,
                                gamePlayed: 0,
                                teamGoalaverage: 0,
                                ballsPlayed: 0,
                                goalConcede: 0,
                                eloRanking : 1500,
                                gameSeries: [],
                                percentGoalPerBall: 0,
                                avgGoalPerGame: 0,
                                percentVictory: 0,
                                percentLoose: 0,
                                ballsPlayedAttack: 0,
                                ballsPlayedDefense: 0
                            };

                            //generate fake id
                            stats.statsPlayers[player.id].fakeId = _getMatrixPlayerId(player.id);
                        }
                    });


                });
        };

        var _addToGamesList = function(games) {
            games.goals.reverse();
            stats.gamesList.push(games);
        };

        this.getGame = function(gameId) {
            return _.findWhere(stats.gamesList, {id: parseInt(gameId) });
        };

        //Get/set Team Id based on composition
        var _initTeam = function(games) {
            var redTeam = [];
            var blueTeam = [];

            //generate unique id for each team of the current game
            games.composition.forEach(function(compo) {
                if (compo.team === 'red') {
                    redTeam.push(compo.player_id);
                } else {
                    blueTeam.push(compo.player_id);
                }
            });

            redTeam.sort();
            var redTeamString = redTeam.join('-');
            blueTeam.sort();
            var blueTeamString = blueTeam.join('-');

            if (_.indexOf(stats.teamList, redTeamString) < 0) {
                stats.teamList.push(redTeamString);
            }
            _redTeamId = _.indexOf(stats.teamList, redTeamString);

            if (_.indexOf(stats.teamList, blueTeamString) < 0) {
                stats.teamList.push(blueTeamString);
            }
            _blueTeamId = _.indexOf(stats.teamList, blueTeamString);

            //Init Red and Blue Team
            if (!stats.statsTeams[_redTeamId]) {
                stats.statsTeams[_redTeamId] = {
                    id: _redTeamId,
                    playerId1: redTeam[0],
                    playerId2: redTeam[1],
                    email1: stats.playersList[redTeam[0]].email,
                    email2: stats.playersList[redTeam[1]].email,
                    victory: 0,
                    loose: 0,
                    teamGoalaverage: 0,
                    ballsPlayed: 0,
                    goal: 0,
                    owngoal: 0,
                    gamePlayed: 0,
                    goalAttack: 0,
                    goalDefense: 0,
                    ballsPlayedAttack: 0,
                    ballsPlayedDefense: 0
                };
            }

            if (!stats.statsTeams[_blueTeamId]) {
                stats.statsTeams[_blueTeamId] = {
                    id: _blueTeamId,
                    playerId1: blueTeam[0],
                    playerId2: blueTeam[1],
                    email1: stats.playersList[blueTeam[0]].email,
                    email2: stats.playersList[blueTeam[1]].email,
                    victory: 0,
                    loose: 0,
                    teamGoalaverage: 0,
                    ballsPlayed: 0,
                    goal: 0,
                    owngoal: 0,
                    gamePlayed: 0,
                    goalAttack: 0,
                    goalDefense: 0,
                    ballsPlayedAttack: 0,
                    ballsPlayedDefense: 0
                };
            }
        };

        this.getStats = function() {
            return stats;
        };

        this.getStatsPlayersFilterBy = function(statType) {
            var oneOrderedStat = [];
            stats.statsPlayers.forEach(function(data) {
                if(data.gamePlayed >= stats.minGamePlayedPlayers) {
                    oneOrderedStat.push({
                        stat: data[statType],
                        players: [{
                            id: data.id,
                            email: stats.playersList[data.id].email,
                            name: stats.playersList[data.id].name
                        }]
                    });
                }
            });
            stats.statsPlayersFiltered = oneOrderedStat.sort(this.dynamicSort('-stat'));
            return stats.statsPlayersFiltered;
        };

        this.getStatsTeamsFilterBy = function(statType, withPlayer) {
            var oneOrderedStat = [];
            stats.statsTeams.forEach(function(data) {
                if(data.gamePlayed >= stats.minGamePlayedTeams) {
                    if(!withPlayer || withPlayer === data.playerId1 || withPlayer === data.playerId2) {
                        oneOrderedStat.push({
                            stat: data[statType],
                            players: [{
                                id: data.playerId1,
                                email: stats.playersList[data.playerId1].email,
                                name: stats.playersList[data.playerId1].name
                            },{
                                id: data.playerId2,
                                email: stats.playersList[data.playerId2].email,
                                name: stats.playersList[data.playerId2].name
                            }]

                        });
                    }
                }
            });
            stats.statsTeamsFiltered = oneOrderedStat.sort(this.dynamicSort('-stat'));
            return stats.statsTeamsFiltered;
        };

        this.dynamicSort = function (property) {
            var sortOrder = 1;
            if(property[0] === '-') {
                sortOrder = -1;
                property = property.substr(1);
            }
            return function (a,b) {
                var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            };
        };

        var _getMatrixPlayerId = function (playerId) {
            var id = 0;
            var findPlayer = _.findWhere(stats.matrix.nodes, {id:playerId});
            if (findPlayer === undefined) {
                var tmpId = stats.matrix.nodes.push({
                    name: stats.playersList[playerId].name,
                    id: playerId,
                    group: 1,
                    fakeId: stats.matrix.nodes.length
                });
                id = tmpId - 1;

            }
            else {
                id = findPlayer.fakeId;
            }
            return id;
        };


        var _setWhoBeatWho = function(game) {
            if (game.red_score === 10) {
                stats.matrix.whoBeatWho.push({
                    'source' : game.redAttackFakeId,
                    'target' : game.blueDefenseFakeId,
                    'value' : 1
                });
                stats.matrix.whoBeatWho.push({
                    'source' : game.redAttackFakeId,
                    'target' : game.blueAttackFakeId,
                    'value' : 1
                });
                stats.matrix.whoBeatWho.push({
                    'source' : game.redDefenseFakeId,
                    'target' : game.blueDefenseFakeId,
                    'value' : 1
                });
                stats.matrix.whoBeatWho.push({
                    'source' : game.redDefenseFakeId,
                    'target' : game.blueAttackFakeId,
                    'value' : 1
                });
            }
            else {
                stats.matrix.whoBeatWho.push({
                    'source' : game.blueAttackFakeId,
                    'target' : game.redDefenseFakeId,
                    'value' : 1
                });
                stats.matrix.whoBeatWho.push({
                    'source' : game.blueAttackFakeId,
                    'target' : game.redAttackFakeId,
                    'value' : 1
                });
                stats.matrix.whoBeatWho.push({
                    'source' : game.blueDefenseFakeId,
                    'target' : game.redDefenseFakeId,
                    'value' : 1
                });
                stats.matrix.whoBeatWho.push({
                    'source' : game.blueDefenseFakeId,
                    'target' : game.redAttackFakeId,
                    'value' : 1
                });
            }
        };


        var _setWhoPlayedWho = function(game) {

            stats.matrix.whoPlayedWithWho.push({
                'source' : game.redAttackFakeId,
                'target' : game.redDefenseFakeId,
                'value' : 1
            });
            stats.matrix.whoPlayedWithWho.push({
                'source' : game.blueAttackFakeId,
                'target' : game.blueDefenseFakeId,
                'value' : 1
            });

            stats.matrix.whoPlayedAgainstWho.push({
                'source' : game.redAttackFakeId,
                'target' : game.blueAttackFakeId,
                'value' : 1
            });

            stats.matrix.whoPlayedAgainstWho.push({
                'source' : game.redAttackFakeId,
                'target' : game.blueDefenseFakeId,
                'value' : 1
            });

            stats.matrix.whoPlayedAgainstWho.push({
                'source' : game.redDefenseFakeId,
                'target' : game.blueAttackFakeId,
                'value' : 1
            });

            stats.matrix.whoPlayedAgainstWho.push({
                'source' : game.redDefenseFakeId,
                'target' : game.blueDefenseFakeId,
                'value' : 1
            });
        };

        this.computeStats = function() {
            var deferred = $q.defer();

            //do not recompute stat when already did
            if (stats.computedStat) {
                deferred.resolve(stats);
                return deferred.promise;
            }
            stats.computedStat = true;

            _initPlayers();

            var gamePagination = {
                getAllPage: function(maxPage) {
                    var deferred = $q.defer();

                    var page = 1;
                    this._getNextPageOrReturn(null, page, maxPage, deferred);

                    return deferred.promise;
                },
                _getNextPageOrReturn: function(data, page, maxPage, deferred) {
                    if (!data) {
                        page = 1;
                        data = [];
                    }

                    var _this = this;
                    Restangular.all('games').getList({
                        page: page,
                        per_page: 100
                    }).then(function(newData) {
                        data = data.concat(newData);

                        if (newData.length < 100 || page === maxPage) {

                            return deferred.resolve(data);
                        }

                        _this._getNextPageOrReturn(data, ++page, maxPage, deferred);
                    });
                }
            };

            //Fetch Games
            gamePagination.getAllPage(3)
                .then(function(data) {
                    //Reverse data :
                    data.reverse();

                    //For each games
                    data.forEach(function(games) {
                        _addToGamesList(games);

                        _setGameComposition(games);

                        _initTeam(games);

                        _setStatsVictoryLoose(games);
                        _setStatsGamePlayed(games);
                        _setStatsTeamGoalaverage(games);
                        _setStatsEloRanking(games);
                        _setWhoPlayedWho(games);
                        _setWhoBeatWho(games);
                        _setDuration(games);

                        //For each Goals
                        games.goals.forEach(function(goal) {
                            _setTeamGoal(games, goal);
                            _setBallComposition(games, goal);
                            _setStatsBallsPlayed(games);
                            _setStatsGoalOwnGoal(goal);
                        });
                    });

                    //Compute percentage on each player
                    stats.playersList.forEach(function(player) {
                        _setStatsPercentVictoryLoose('Players', player.id);
                        _setStatsPercentGoal('Players', player.id);
                        _setStatsPercentPosition('Players', player.id);

                        //Generate GameSeries
                        stats.statsPlayers[player.id].gameSeries = stats.statsPlayers[player.id].gameSeries.slice(-5);

                        if (stats.statsPlayers[player.id].gamePlayed) {
                            stats.statsPlayers[player.id].teamGoalaverage = +(stats.statsPlayers[player.id].teamGoalaverage / stats.statsPlayers[player.id].gamePlayed).toFixed(1);
                        }
                    });

                    //Compute percentage on each team
                    stats.statsTeams.forEach(function(team) {
                        _setStatsPercentVictoryLoose('Teams', team.id);
                        _setStatsPercentGoal('Teams', team.id);

                        if (stats.statsTeams[team.id].gamePlayed) {
                            stats.statsTeams[team.id].teamGoalaverage = +(stats.statsTeams[team.id].teamGoalaverage / stats.statsTeams[team.id].gamePlayed).toFixed(1);
                        }

                        //Round Team Elo Ranking
                        stats.statsTeams[team.id].eloRanking = +(stats.statsTeams[team.id].eloRanking).toFixed(0);

                    });

                    _setMinGamePlayed();

                    //Reverse order of gameslist
                    stats.gamesList.reverse();
                    deferred.resolve(stats);

                });

            return deferred.promise;
        };

    });
