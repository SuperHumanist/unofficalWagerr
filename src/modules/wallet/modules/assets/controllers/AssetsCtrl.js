(function () {
    'use strict';

    const controller = function ($timeout, assetsService, $scope, utils, $mdDialog, Base) {

        const UPDATE_INTERVAL = 2000;

        class Assets extends Base {

            constructor() {
                super();

                $scope.$on('$destroy', this.$onDestroy.bind(this));

                this.mode = null;
                this.assets = null;
                this.total = null;

                this.data = { values: [{ x: 0, y: 0 }] };
                this.options = assetsService.getGraphOptions();

                this.syncSettings('wallet.assets.mode');

                this.observe('mode', () => this._onChangeMode());
                this.observe(['startDate', 'endDate'], () => this._onChangeInterval());

                this._initializeTimeout();
                this._addAssets();
            }

            $onDestroy() {
                super.$onDestroy();
                if (this.timer) {
                    $timeout.cancel(this.timer);
                }
            }

            onAssetClick(event, asset, action) {
                event.preventDefault();
                switch (action) {
                    case 'send':
                        this._showSendModal(asset);
                        break;
                    case 'receive':
                        this._showReceiveModal(asset);
                        break;
                }
            }

            /**
             * @private
             */
            _addAssets() {
                assetsService.getAssets()
                    .then((assets) => {
                        this.assets = assets;
                        this.total = assets.reduce((result, item) => {
                            return result + item.balance;
                        }, 0);
                    });
            }

            /**
             * @param asset
             * @private
             */
            _showSendModal(asset) {
                $mdDialog.show({
                    clickOutsideToClose: true,
                    escapeToClose: true,
                    locals: { asset },
                    bindToController: true,
                    templateUrl: '/modules/wallet/modules/assets/templates/send.modal.html',
                    controller: 'AssetSendCtrl as $ctrl'
                });
            }

            /**
             * @param asset
             * @private
             */
            _showReceiveModal(asset) {
                $mdDialog.show({
                    clickOutsideToClose: true,
                    escapeToClose: true,
                    locals: { asset },
                    bindToController: true,
                    templateUrl: '/modules/wallet/modules/assets/templates/receive.modal.html',
                    controller: 'AssetReceiveCtrl as $ctrl'
                });
            }

            /**
             * @private
             */
            _initializeTimeout() {
                this.timer = $timeout(() => {
                    this._onChangeInterval();
                    this._initializeTimeout();
                }, UPDATE_INTERVAL);
            }

            /**
             * @private
             */
            _onChangeInterval() {
                assetsService.getGraphData(this.startDate, this.endDate)
                    .then((values) => {
                        this.data = { values };
                        $scope.$apply();
                    });
            }

            /**
             * @private
             */
            _onChangeMode() {
                switch (this.mode) {
                    case 'week':
                        this.startDate = utils.moment()
                            .add
                            .day(-7);
                        break;
                    case 'month':
                        this.startDate = utils.moment()
                            .add
                            .month(-1);
                        break;
                    case 'year':
                        this.startDate = utils.moment()
                            .add
                            .year(-1);
                        break;
                }
                this.endDate = utils.moment();
            }

        }

        return new Assets();
    };

    controller.$inject = ['$timeout', 'wallet.assetsService', '$scope', 'utils', '$mdDialog', 'Base', '$scope'];

    angular.module('app.wallet.assets')
        .controller('AssetsCtrl', controller);
})();