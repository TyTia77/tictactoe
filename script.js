var app = angular.module('app', ['ngRoute']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('');

    $routeProvider
        .when('/', {
            templateUrl: 'views/select-symbol.html',
            controller: 'symbolCtrl'
        })
        .when('/game', {
            templateUrl: 'views/game.html',
            controller: 'ctrl'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);

app.service('symbolSer', [ '$rootScope', function($rootScope){
    this.player1 = '';
    this.player2 = '';
}]);

app.service('boardSer', ['$rootScope', function($rootScope){
    this.winCom = [
        [0, 1, 2], [0, 3, 6], [0, 4, 8], [1, 4, 7], [2, 5, 8], [2, 4, 6], [3, 4, 5], [6, 7, 8]
    ];

    this.getNew = function(){
        return [
            0,0,0,
            0,0,0,
            0,0,0
        ];
    }

    this.getBoard = function(board, type){
        var temp = [];
        for (var i = 0; i < board.length; i++){
            if (board[i] === type){
                temp.push(i);
            }
        }
        return temp;
    }
}]);

app.controller('symbolCtrl', ['$scope', 'symbolSer', function($scope, symbolSer){
    $('span').on('click', function(e){
        var symbol = e.target.innerHTML;
        symbolSer.player1 = symbol;
        symbolSer.player2 = symbol === 'X' ? 'O' : 'X';
        window.open('#game', '_self');
    });
}]);


app.controller('ctrl', ['$scope', 'symbolSer', 'boardSer', '$timeout', function($scope, symbolSer, boardSer, $timeout){

    var player = function(name, sym, ai){
        this.name = name;
        this.symbol = sym;
        this.isAi = ai;
    };

    player.prototype.getSym = function(){
        return this.symbol;
    };
    player.prototype.getName = function(){
        return this.name;
    };

    var player1 = new player('player', symbolSer.player1, false);
    var player2 = new player('computer', symbolSer.player2, true);
    var state;
    checkPlayers();
    clearBoard();

    // fix bug on refresh page, symbol gets erased
    function checkPlayers(){
        if (!player1.symbol || !player2.symbol){
            window.open('#/asdf', '_self');
        };
    }

    // randomise who starts first
    function getFirstStart(){
        var rand = Math.ceil(Math.random() * 2);
        $scope.currentPlayer = rand === 1 ? player1 : player2;

        if($scope.currentPlayer.name === 'computer'){
            setTimeout(aiMove, 1000);
        }
    }

    $scope.handleClick = function(e){
        var select = Number(e.target.attributes.location.value);

        if (!state[select] && !$scope.currentPlayer.isAi){
            state[select] = $scope.currentPlayer.symbol;
            flip(select);
        }
    };

    function isBoardFull(){
        return state.indexOf(0) >= 0 ? false : true;
    }

    // next players turn switch players
    function switchTurns(){
        // check winner
        var winner = isWinner(state, $scope.currentPlayer);

        if (winner){
            output(true);
        } else if (isBoardFull()){
            output();
        } else {
            $scope.currentPlayer = $scope.currentPlayer.isAi ? player1 : player2;

            if ($scope.currentPlayer.name === 'computer'){
                setTimeout(aiMove, 1000);
            } else {
                $scope.$digest();
            }
        }
    }

    // flips the board
    function flip(index){
        var dom = $('.boxes[location=' +index +']');
        dom.addClass('turn');
        $timeout(function(){
            dom.html($scope.currentPlayer.symbol);
            $scope.currentPlayer.symbol === 'X' ? dom.addClass('x') : dom.addClass('o');
            switchTurns();
        },50);
    }

    function displayWinCombo(array){
        array.forEach(function(index){
            var dom = $('.boxes[location=' +index +']');
            dom.addClass('lightup');
        })
    }

    // win or draw argument
    function output(win){
        $scope.winner = true;
        win ? displayWinCombo(isWinner(state, $scope.currentPlayer, true)) : null;
        var msg = win ? $scope.currentPlayer.name +' wins !!' : 'draw !!';
        $scope.outputMsg = msg;
        $scope.$digest();
    }

    function isWinner(boardstate, player, combo){
        var currentMoves = boardSer.getBoard(boardstate, player.symbol);

        var haveWinner = boardSer.winCom.find(function(x){
            var matches = x.reduce(function(match, value){
                currentMoves.indexOf(value) >= 0 ? match++ : match;
                return match;
            }, 0);

            if (matches > 2){
                return x;
            }
        });

        return combo ? haveWinner : haveWinner ? true : false;
    }

    function aiMove(){
        var bestMove = minimax(state, 0, $scope.currentPlayer);
        flip(bestMove);
        state[bestMove] = $scope.currentPlayer.symbol;
    }

    function minimax(board, depth, currentPlayer){

        var isAi = currentPlayer.isAi;
        var otherPlayer = isAi ? player1 : player2;
        var boardState = board.slice();
        var availableMoves = boardSer.getBoard(boardState, 0);

        if (isWinner(boardState, otherPlayer)){

            // return a score of 10 if ai wins, -10 if ai loses
            return isAi ? -10 - depth : 10 - depth;
        } else if (boardState.indexOf(0) === -1) {

              // tie game
              return 0;
        } else {

            var bestresult;
            var currentresult;
            var bestValue = isAi ? -Infinity : Infinity;
            var condition = function(){
                return isAi ? currentresult > bestValue : currentresult < bestValue;
            };

            // loop through all available moves
            availableMoves.forEach(function(nextMove){

                // place value on board
                boardState[nextMove] = currentPlayer.symbol;
                currentresult = minimax(boardState, depth-1, otherPlayer);

                if (condition()){
                    bestValue = currentresult;
                    bestresult = nextMove;
                }

                // revert board
                boardState[nextMove] = 0;
            });

            // return best location to place on the board
            // if on rootlevel, otherwise return best computed value;
            return !depth ? bestresult : bestValue;
          }
    }

    $scope.clickRestart = function(){
        window.open('#/asdf', '_self');
    }
    $scope.clickReplay = function(){
        clearBoard();
    }

    function clearBoard(){
        
        var rmClass = ['turn', 'x', 'o', 'lightup'];
        var boxes = $('.boxes');
        $scope.winner = false;
        state = boardSer.getNew();
        boxes.html('');

        rmClass.forEach(function(cl){
            boxes.removeClass(cl);
        })
        getFirstStart();
    }

}]);
