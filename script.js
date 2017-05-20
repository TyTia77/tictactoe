var app = angular.module('app', ['ngRoute']);

app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('');

    $routeProvider
        .when('/', {
            templateUrl: 'views/select-symbol.html',
            controller: 'selectSymbolCtrl'
        })
        .when('/game', {
            templateUrl: 'views/game.html',
            controller: 'ctrl'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);

app.service('symbolCtrl', [ '$rootScope', function($rootScope){
    this.player1 = '';
    this.player2 = '';
}]);

app.service('boardCtrl', ['$rootScope', function($rootScope){
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

app.controller('selectSymbolCtrl', ['$scope', 'symbolCtrl', function($scope, symbolCtrl){
    $('span').on('click', function(e){
        var symbol = e.target.innerHTML;
        console.log(symbol);
        symbolCtrl.player1 = symbol;
        symbolCtrl.player2 = symbol === 'X' ? 'O' : 'X';
        window.open('#game', '_self');
    });
}]);


app.controller('ctrl', ['$scope', 'symbolCtrl', 'boardCtrl', function($scope, symbolCtrl, boardCtrl){

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

    var player1 = new player('player', symbolCtrl.player1, false);
    var player2 = new player('computer', symbolCtrl.player2, true);
    var state = boardCtrl.getNew();


    $scope.winner = false;


    // randomise who starts first
    var rand = Math.ceil(Math.random() * 2);
    $scope.currentPlayer = rand === 1 ? player1 : player2;

    if($scope.currentPlayer.name === 'computer'){
        setTimeout(aiMove, 1000);
    }

    $scope.handleClick = function(e){
        var select = Number(e.target.attributes.location.value);
        var moveMade = false;

        if (state.indexOf(0) >= 0 && $scope.currentPlayer.name !== 'computer'){
            state[select] = $scope.currentPlayer.symbol;
            e.target.innerHTML = $scope.currentPlayer.symbol;
            isWinner(state, $scope.currentPlayer);
            moveMade = true;
        } else {
            // todo
            console.log('move alrdy selected');
        }

        if (moveMade){
            $scope.currentPlayer = $scope.currentPlayer === player1 ? player2 : player1;

            if($scope.currentPlayer.name === 'computer'){
                setTimeout(aiMove, 1000);
            }
        }
    };

    function isWinner(boardstate, player){
        var currentMoves = boardCtrl.getBoard(boardstate, player.symbol);

        var haveWinner = boardCtrl.winCom.find(function(x){
            var matches = x.reduce(function(match, value){
                (currentMoves.indexOf(value) >= 0) ? match++ : match;
                return match;
            }, 0);

            if (matches > 2){
                return true;
            }
        });

        return haveWinner ? true : false;
    }

    function aiMove(){

        var bestMove = minimax(state, 0, $scope.currentPlayer);
        $('.boxes[location='+bestMove +']').html($scope.currentPlayer.symbol);
        state[bestMove] = $scope.currentPlayer.symbol;
        $scope.currentPlayer = player1;
        $scope.$digest();
    }

    function minimax(board, depth,  currentPlayer){

        var isAi = currentPlayer.isAi;
        var otherPlayer = isAi ? player1 : player2;
        var boardState = board.slice();
        var availableMoves = boardCtrl.getBoard(boardState, 0);

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


    function clearBoard(){
        // todo
    }

}]);