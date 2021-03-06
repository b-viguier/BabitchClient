'use strict';

angular.module('babitchFrontendApp').controller('babitchAdminPlayerEditCtrl', function($scope, Restangular, $stateParams, $location) {

    $scope.player = {
        id: 0
    };

    Restangular.one('players', $stateParams.id).get().then(function(data) {
        $scope.player = data;
    });

    // function to submit the form after all validation has occurred
    $scope.submitForm = function() {

        // check to make sure the form is completely valid
        if ($scope.playerForm.$valid) {
            $scope.player.put().then(function() {
                $location.path('/admin/players');
            });
            return true;
        } else {
            return false;
        }
    };
});
