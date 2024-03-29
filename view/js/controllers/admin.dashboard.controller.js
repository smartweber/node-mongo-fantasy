// ADMIN DASHBOARD CONTROLLER
app.controller('adminDashboardController',function($scope,$http,$location,meanData,$window,$route) {

    var vm = this;
    vm.user = {};
    $scope.balanceData = [];
    $scope.gamesByTitle = [];
    meanData.getProfile()
      .success(function(data) {
        vm.user = data;
      })
      .error(function (e) {
        console.log(e);
      });


    $scope.Math = window.Math;
    $scope.usersData = [];
    $scope.openBets = [];
    $scope.historyBets = [];
    $scope.adminHistoryBets = [];
    $scope.adminHistoryBetsByDate = [];
    $scope.isMoreHistoryAvailable = true;
    // getUsersData();
    getOpenBets();
    getHistoryBetsData();

    function getUsersData() {
      $http.get("/users/sitepoint").success(function(response){
        $scope.usersData = response.data;
      });
    }

    // function sortByDate(games) {
    //   _.forEach(games, function(value, key) {
    //     $scope.adminHistoryBetsByDate.push(value);
    //   });
    // }

    function getHistoryBetsData() {
      $http.get("/games/gamehistory").success(function(response) {
        $scope.adminHistoryBets = response.data;
        if ($scope.adminHistoryBets.length < 10) {
          $scope.isMoreHistoryAvailable = false;
        }
        console.log('game history: ', $scope.adminHistoryBets);
        // alert($scope.adminHistoryBets.length);
        // $scope.adminHistoryBetsByDate = _.orderBy($scope.adminHistoryBets, ['date'], ['desc']);
        $scope.adminHistoryBetsByDate = $scope.adminHistoryBets;
      });

      $http.get("/users/sitepoint/").success(function(response){
        $scope.historyBets = response.data;
        _.forEach($scope.historyBets, function(value, key) {
          if (value.totalbets) {
            var winrate = value.wins / value.totalbets * 100;
            value.winrate = Number(winrate.toFixed(2));
          } else {
            value.winrate = 0;
          }          
        });
        console.log('site points: ', $scope.historyBets);
      });
    }

    $scope.loadMoreHistory = function() {
      $http.get('/games/gamehistory/skip/' + $scope.adminHistoryBetsByDate.length)
      .success(function(response) {
        if (response.data.length < 10) {
          $scope.isMoreHistoryAvailable = false;
        }
        $scope.adminHistoryBetsByDate = $scope.adminHistoryBetsByDate.concat(response.data);
        console.log('fetch game : ', $scope.adminHistoryBetsByDate);
        // $scope.$apply();
      });
    }

    function getHistoryBetsData1() {
      $http.get("/games/bethistory").success(function(response){
        $scope.adminHistoryBets = response.data;
        $scope.adminHistoryBets = _.groupBy($scope.adminHistoryBets, 'gameTitle');
        _.forEach($scope.adminHistoryBets, function(value, key) {
          $scope.adminHistoryBets[key] = _.groupBy($scope.adminHistoryBets[key], 'lineName');
          // console.log($scope.adminHistoryBets[key])
          var lineIndex = 0;
          var lineType = 0;
          _.forEach($scope.adminHistoryBets[key], function(value2, key2) {
            lineIndex = value2[0].lineIndex;
            lineType = value2[0].lineType;
            // console.log("asdasdadsdadd")
            // console.log($scope.adminHistoryBets[key][key2])
            // console.log(_.sumBy($scope.adminHistoryBets[key][key2], 'result'));
            $scope.adminHistoryBets[key][key2].result = _.sumBy($scope.adminHistoryBets[key][key2], 'result');
            $scope.adminHistoryBets[key][key2].lineIndex = lineIndex;
            $scope.adminHistoryBets[key][key2].lineType = lineType;
          });
        });
        console.log($scope.adminHistoryBets);
        $scope.historyBets = _.groupBy(response.data, 'userId');
        _.forEach($scope.historyBets, function(value, key) {
          // calculate winrate
          var totalBets = _.size(value);
          $scope.historyBets[key] = _.groupBy($scope.historyBets[key], 'status');
          // console.log(key, 'wins/loses');
          var winCount = $scope.historyBets[key].Winner ? $scope.historyBets[key].Winner.length : 0;
          var loseCount = $scope.historyBets[key].Loser ? $scope.historyBets[key].Loser.length : 0;
          console.log(key, ' wins: ', winCount, ' loses: ', loseCount);
          var wins = $scope.historyBets[key].Winner || [];
          $scope.historyBets[key].winrate = Math.round(wins.length / totalBets * 100);
          // get user balance
          $http.get("/users/sitepoint/"+key).success(function(response){
            $scope.historyBets[key].balance = response.data[0].balance;
          });
        });
        _.forEach($scope.adminHistoryBets, function(gameValue, gameKey) {
          var lines = [];
          _.forEach(gameValue, function(lineValue, lineKey) {
            lineValue.lineName = lineKey;
            lines.push(lineValue)
            delete $scope.adminHistoryBets[gameKey][lineKey];
          });
          gameValue.gameTitle = gameKey;
          var firstProperty = gameValue[Object.keys(gameValue)[0]];
          gameValue.date = firstProperty[0].date;
          gameValue.lines = lines;
        });
        console.log("historyBETS")
        console.log($scope.adminHistoryBets)
        sortByDate($scope.adminHistoryBets)
        $scope.adminHistoryBetsByDate = _.orderBy($scope.adminHistoryBetsByDate, ['date'], ['desc']);
        console.log("historyBETSBYDATE")
        console.log($scope.adminHistoryBetsByDate)
      });
    }

    function getOpenBets() {
      $http.get("/games/openbets/open").success(function(response){
        // group bets by games
        $scope.openBets = _.groupBy(response.data, 'gameTitle');
        // group bets by lines
        _.forEach($scope.openBets, function(gameValue, gameKey) {
          $scope.openBets[gameKey] = _.groupBy($scope.openBets[gameKey], 'lineName');
          // group bets by options
          _.forEach($scope.openBets[gameKey], function(lineValue, lineKey) {
            $scope.openBets[gameKey][lineKey] = _.groupBy($scope.openBets[gameKey][lineKey], 'optionName');
            var maxBet = 0;
            var maxRisk = 0;
            var minBet = 99999;
            var minRisk = 0;
            var lineIndex = 0;
            var lineType = "";
            _.forEach($scope.openBets[gameKey][lineKey], function(optionValue, optionKey) {
              lineIndex = optionValue[0].lineIndex;
              lineType = optionValue[0].lineType;
              var betSum = _.sumBy(optionValue, 'betAmount');
              var riskSum = _.sumBy(optionValue, 'toRisk');
              optionValue.betSum = betSum;
              optionValue.riskSum = riskSum;
              if(betSum > maxBet) { maxBet = betSum; maxRisk = riskSum*(-1) }
              if(betSum < minBet) { minBet = betSum; minRisk = riskSum*(-1) }
            });
            var netRisk = maxRisk - minBet;
            var netToWin = maxBet - minRisk;
            $scope.openBets[gameKey][lineKey].risk = netRisk;
            $scope.openBets[gameKey][lineKey].toWin = netToWin;
            $scope.openBets[gameKey][lineKey].lineIndex = lineIndex;
            $scope.openBets[gameKey][lineKey].lineType = lineType;
          });
        });
        // _.orderBy($scope.openBets, ['user'], ['asc']);
        _.forEach($scope.openBets, function(gameValue, gameKey) {
          var lines = [];
          var gameRisk = 0, gameToWin = 0;
          _.forEach(gameValue, function(lineValue, lineKey) {
            lineValue.lineName = lineKey;
            var maxOutcome = 0, minOutcome = 0;
            
            // calculate maximum net outcome of each option for admin
            _.forEach(lineValue, function(optionValue, optionKey) {
              if ((optionKey !== 'lineIndex') && (optionKey !== 'lineType') && (optionKey !== 'risk') && 
                  (optionKey !== 'toWin') && (optionKey !== 'lineName')) {
                var riskOnOtherOptions = 0, optionCount = 0;
                _.forEach(lineValue, function(otherOptionValue, otherOptionKey) {
                  if ((otherOptionKey !== 'lineIndex') && (otherOptionKey !== 'lineName') && (otherOptionKey !== 'lineType') 
                    && (otherOptionKey !== 'risk') && (otherOptionKey !== 'toWin') && (otherOptionKey !== optionKey)) {
                    riskOnOtherOptions += otherOptionValue.riskSum;
                    optionCount ++;
                  }
                });
                optionValue.netOutcome = optionValue.betSum - riskOnOtherOptions;
                if (maxOutcome < optionValue.netOutcome) maxOutcome = optionValue.netOutcome;
                if (minOutcome > optionValue.netOutcome) minOutcome = optionValue.netOutcome;
                if (optionCount == 0) minOutcome = 0 - optionValue.riskSum;
              }
            });
            lineValue.maxBet = maxOutcome;
            lineValue.maxRisk = minOutcome;
            gameRisk += minOutcome;
            gameToWin += maxOutcome;
            lines.push(lineValue);
            delete $scope.openBets[gameKey][lineKey];
          });
          gameValue.lines = lines;
          gameValue.risk = gameRisk;
          gameValue.toWin = gameToWin;
        });
        console.log("openBETS")
        console.log($scope.openBets)
      });
    }

    $scope.accordionInit = function () {
        $('.ui.accordion').accordion();
    };

    $scope.reload = function () {
        $window.location.reload();
    };

    $scope.logout = function() {
      $window.localStorage.removeItem('mean-token');
      $location.path("/profile")
    };

});