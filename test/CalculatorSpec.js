describe('Calculator', function() {

    describe('with tasks', function() {
        
        var data, store;

        function expectChartDataToBe(chartData, expectedSeriesData) {
            expect(chartData.categories).toEqual(['Defined', 'In-Progress', 'Completed']);
            expect(chartData.series.length).toBe(1);
            var seriesData = chartData.series[0];
            expect(seriesData.name).toBe('State');
            expect(seriesData.data).toEqual(expectedSeriesData);
        }

        beforeEach(function() {
            var model = Rally.test.Mock.dataFactory.getModel('task');
            data = Rally.test.Mock.dataFactory.getRecords('task', {
                count: 4,
                values: [
                    { Actuals: 1, Estimate: 2, State: 'Defined' },
                    { Actuals: 2, Estimate: 3, State: 'In-Progress' },
                    { Actuals: 3, Estimate: 4, State: 'Completed' },
                    { Actuals: 4, Estimate: 5, State: 'Completed' }
                ]
            });
            store = Ext.create('Rally.data.wsapi.Store', {
              model: model,
              data: data
            });
        });

        it('should aggregate by count', function() {
            var calculator = Ext.create('Calculator', {
                field: 'State',
                calculationType: 'count'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [['Defined', 1], ['In-Progress', 1], ['Completed', 2]]);
        });

        it('should aggregate by estimate', function() {
            var calculator = Ext.create('Calculator', {
                field: 'State',
                calculationType: 'taskest'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [['Defined', 2], ['In-Progress', 3], ['Completed', 9]]);
        });

         it('should aggregate by actuals', function() {
            var calculator = Ext.create('Calculator', {
                field: 'State',
                calculationType: 'taskactuals'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [['Defined', 1], ['In-Progress', 2], ['Completed', 7]]);
        });
    });

    describe('with defects', function() {

        var data, store;

        function expectChartDataToBe(chartData, expectedSeriesData) {
            expect(chartData.categories).toEqual(['P1', 'P2', 'P3', 'P4']);
            expect(chartData.series.length).toBe(1);
            var seriesData = chartData.series[0];
            expect(seriesData.name).toBe('Priority');
            expect(seriesData.data).toEqual(expectedSeriesData);
        }

        beforeEach(function() {
            var model = Rally.test.Mock.dataFactory.getModel('defect');
            data = Rally.test.Mock.dataFactory.getRecords('defect', {
                count: 4,
                values: [
                    { Priority: 'P1', PlanEstimate: 2, Owner: null, c_KanbanState: '', Tags: { _tagsNameArray: [] }, ClosedDate: null },
                    { Priority: 'P2', PlanEstimate: 3, Owner: { _refObjectName: 'User1' }, c_KanbanState: 'Building', Tags: { _tagsNameArray: [{ Name: 'Foo' }, { Name: 'Bar' }] }, ClosedDate: '2017-01-02T12:00:00Z' },
                    { Priority: 'P3', PlanEstimate: 4, Owner: { _refObjectName: 'User2' }, c_KanbanState: 'Testing', Tags: { _tagsNameArray: [{ Name: 'Bar' }, { Name: 'Baz' }] }, ClosedDate: '2017-01-04T12:00:00Z' },
                    { Priority: 'P4', PlanEstimate: 5, Owner: { _refObjectName: 'User3' }, c_KanbanState: 'Done',  Tags: { _tagsNameArray: [{ Name: 'Baz' }] }, ClosedDate: null }
                ]
            });
            store = Ext.create('Rally.data.wsapi.Store', {
              model: model,
              data: data
            });
        });

        it('should aggregate by count', function() {
            var calculator = Ext.create('Calculator', {
                field: 'Priority',
                calculationType: 'count'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [['P1', 1], ['P2', 1], ['P3', 1], ['P4', 1]]);
        });

        it('should aggregate by plan estimate', function() {
            var calculator = Ext.create('Calculator', {
                field: 'Priority',
                calculationType: 'estimate'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [['P1', 2], ['P2', 3], ['P3', 4], ['P4', 5]]);
        });

        it('should bucket by object type', function() {
            var calculator = Ext.create('Calculator', {
                field: 'Owner',
                calculationType: 'count'
            });
            var chartData = calculator.prepareChartData(store);
            expect(chartData.categories).toEqual(['-- No Owner --', 'User1', 'User2', 'User3']);
        });

        it('should bucket by custom field type', function() {
            var calculator = Ext.create('Calculator', {
                field: 'c_KanbanState',
                calculationType: 'estimate'
            });
            var chartData = calculator.prepareChartData(store);
            expect(chartData.categories).toEqual(['-- No Entry --', 'Building', 'Testing', 'Done']);
        });

        describe('when bucketing by date field type', function() {

            it('should bucket by day by default', function() {
                var calculator = Ext.create('Calculator', {
                    field: 'ClosedDate',
                    calculationType: 'estimate'
                });
                var chartData = calculator.prepareChartData(store);
                expect(chartData.categories).toEqual(['-- No Entry --', '2017-01-02', '2017-01-03', '2017-01-04']);
            });

            it('should bucket by day', function() {
                var calculator = Ext.create('Calculator', {
                    field: 'ClosedDate',
                    calculationType: 'estimate',
                    bucketBy: 'day'
                });
                var chartData = calculator.prepareChartData(store);
                expect(chartData.categories).toEqual(['-- No Entry --', '2017-01-02', '2017-01-03', '2017-01-04']);
            });

            it('should bucket by week', function() {
                var calculator = Ext.create('Calculator', {
                    field: 'ClosedDate',
                    calculationType: 'estimate',
                    bucketBy: 'week'
                });
                var chartData = calculator.prepareChartData(store);
                expect(chartData.categories).toEqual([ '-- No Entry --', '2017-01-01' ]);
            });

            it('should bucket by month', function() {
                var calculator = Ext.create('Calculator', {
                    field: 'ClosedDate',
                    calculationType: 'estimate',
                    bucketBy: 'month'
                });
                var chartData = calculator.prepareChartData(store);
                expect(chartData.categories).toEqual([ '-- No Entry --', 'Jan \'17' ]);
            });

            it('should bucket by quarter', function() {
                var calculator = Ext.create('Calculator', {
                    field: 'ClosedDate',
                    calculationType: 'estimate',
                    bucketBy: 'quarter'
                });
                var chartData = calculator.prepareChartData(store);
                expect(chartData.categories).toEqual([ '-- No Entry --', '2017 Q1' ]);
            });

            it('should bucket by year', function() {
                var calculator = Ext.create('Calculator', {
                    field: 'ClosedDate',
                    calculationType: 'estimate',
                    bucketBy: 'year'
                });
                var chartData = calculator.prepareChartData(store);
                expect(chartData.categories).toEqual(['2017', '-- No Entry --' ]);
            });
        });

        it('should aggregate by collection field', function() {
            var calculator = Ext.create('Calculator', {
                field: 'Tags',
                calculationType: 'estimate'
            });
            var chartData = calculator.prepareChartData(store);
            expect(chartData.categories).toEqual(['None', 'Foo', 'Bar', 'Baz']);
            var seriesData = chartData.series[0];
            expect(seriesData.name).toBe('Tags');
            expect(seriesData.data).toEqual([['None', 2], ['Foo', 3], ['Bar', 7], ['Baz', 9]]);
        });
    });

    describe('with features', function() {

        var data, store;

        function expectChartDataToBe(chartData, expectedSeriesData) {
            expect(chartData.categories).toEqual(['UX', 'Maintenance', 'Product Roadmap', 'Architecture Roadmap']);
            expect(chartData.series.length).toBe(1);
            var seriesData = chartData.series[0];
            expect(seriesData.name).toBe('InvestmentCategory');
            expect(seriesData.data).toEqual(expectedSeriesData);
        }

        beforeEach(function() {
            var model = Rally.test.Mock.dataFactory.getModel('portfolioitem/feature');
            data = Rally.test.Mock.dataFactory.getRecords('portfolioitem/feature', {
                count: 4,
                values: [
                    { InvestmentCategory: 'UX', PreliminaryEstimateValue: 2, Parent: null, AcceptedLeafStoryCount: 3, AcceptedLeafStoryPlanEstimateTotal: 4, LeafStoryCount: 5, LeafStoryPlanEstimateTotal: 6, RefinedEstimate: 7 },
                    { InvestmentCategory: 'Maintenance', PreliminaryEstimateValue: 3, Parent: { _refObjectName: 'Initiative1' }, AcceptedLeafStoryCount: 4, AcceptedLeafStoryPlanEstimateTotal: 5, LeafStoryCount: 6, LeafStoryPlanEstimateTotal: 7, RefinedEstimate: 8 },
                    { InvestmentCategory: 'Product Roadmap', PreliminaryEstimateValue: 4, Parent: { _refObjectName: 'Initiative2' }, AcceptedLeafStoryCount: 5, AcceptedLeafStoryPlanEstimateTotal: 6, LeafStoryCount: 7, LeafStoryPlanEstimateTotal: 8, RefinedEstimate: 9 },
                    { InvestmentCategory: 'Architecture Roadmap', PreliminaryEstimateValue: 5, Parent: { _refObjectName: 'Initiative3' }, AcceptedLeafStoryCount: 6, AcceptedLeafStoryPlanEstimateTotal: 7, LeafStoryCount: 8, LeafStoryPlanEstimateTotal: 9, RefinedEstimate: 10 }
                ]
            });
            store = Ext.create('Rally.data.wsapi.Store', {
              model: model,
              data: data
            });
        });

        it('should aggregate by count', function() {
            var calculator = Ext.create('Calculator', {
                field: 'InvestmentCategory',
                calculationType: 'count'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [['UX', 1], ['Maintenance', 1], ['Product Roadmap', 1], ['Architecture Roadmap', 1]]);
        });

        it('should aggregate by preliminary estimate value total', function() {
          var calculator = Ext.create('Calculator', {
              field: 'InvestmentCategory',
              calculationType: 'prelimest'
          });
          var chartData = calculator.prepareChartData(store);
          expectChartDataToBe(chartData, [['UX', 2], ['Maintenance', 3], ['Product Roadmap', 4], ['Architecture Roadmap', 5]]);
        });

        it('should aggregate by accepted leaf count', function() {
          var calculator = Ext.create('Calculator', {
              field: 'InvestmentCategory',
              calculationType: 'acceptedleafcount'
          });
          var chartData = calculator.prepareChartData(store);
          expectChartDataToBe(chartData, [['UX', 3], ['Maintenance', 4], ['Product Roadmap', 5], ['Architecture Roadmap', 6]]);
        });

        it('should aggregate by accepted leaf story plan estimate total', function() {
          var calculator = Ext.create('Calculator', {
              field: 'InvestmentCategory',
              calculationType: 'acceptedleafplanest'
          });
          var chartData = calculator.prepareChartData(store);
          expectChartDataToBe(chartData, [['UX', 4], ['Maintenance', 5], ['Product Roadmap', 6], ['Architecture Roadmap', 7]]);
        });

        it('should aggregate by leaf story count', function() {
          var calculator = Ext.create('Calculator', {
              field: 'InvestmentCategory',
              calculationType: 'leafcount'
          });
          var chartData = calculator.prepareChartData(store);
          expectChartDataToBe(chartData, [['UX', 5], ['Maintenance', 6], ['Product Roadmap', 7], ['Architecture Roadmap', 8]]);
        });

        it('should aggregate by leaf story plan estimate total', function() {
          var calculator = Ext.create('Calculator', {
              field: 'InvestmentCategory',
              calculationType: 'leafplanest'
          });
          var chartData = calculator.prepareChartData(store);
          expectChartDataToBe(chartData, [['UX', 6], ['Maintenance', 7], ['Product Roadmap', 8], ['Architecture Roadmap', 9]]);
        });

        it('should aggregate by refined estimate total', function() {
          var calculator = Ext.create('Calculator', {
              field: 'InvestmentCategory',
              calculationType: 'refinedest'
          });
          var chartData = calculator.prepareChartData(store);
          expectChartDataToBe(chartData, [['UX', 7], ['Maintenance', 8], ['Product Roadmap', 9], ['Architecture Roadmap', 10]]);
        });

        it('should bucket by object type', function() {
            var calculator = Ext.create('Calculator', {
                field: 'Parent',
                calculationType: 'count'
            });
            var chartData = calculator.prepareChartData(store);
            expect(chartData.categories).toEqual(['None', 'Initiative1', 'Initiative2', 'Initiative3']);
        });
    });

    describe('with stacking', function() {

        var data, store;

        function expectChartDataToBe(chartData, expectedSeriesData) {
            expect(chartData.categories).toEqual(['None', 'P1', 'P2', 'P3']);
            expect(chartData.series).toEqual(expectedSeriesData);
        }

        beforeEach(function() {
            var model = Rally.test.Mock.dataFactory.getModel('defect');
            data = Rally.test.Mock.dataFactory.getRecords('defect', {
                count: 5,
                values: [
                    { Priority: '', Severity: 'S1', PlanEstimate: 2, Owner: null, Iteration: { _refObjectName: 'Iteration 1', StartDate: '2014-05-06' }, Release: { _refObjectName: 'Release 1', ReleaseStartDate: '2014-05-06' } },
                    { Priority: 'P1', Severity: 'S2', PlanEstimate: 3, Owner: { _refObjectName: 'User1' }, Iteration: { _refObjectName: 'Iteration 3', StartDate: '2016-02-03' }, Release: { _refObjectName: 'Release 3', ReleaseStartDate: '2016-02-03' } },
                    { Priority: 'P2', Severity: 'S3', PlanEstimate: 4, Owner: { _refObjectName: 'User2' }, Iteration: null, Release: null },
                    { Priority: 'P3', Severity: '', PlanEstimate: 5, Owner: { _refObjectName: 'User3' }, Iteration: { _refObjectName: 'Iteration 2', StartDate: '2015-01-02' }, Release: { _refObjectName: 'Release 2', ReleaseStartDate: '2015-01-02' } },
                    { Priority: 'P3', Severity: '', PlanEstimate: 6, Owner: { _refObjectName: 'User3' }, Iteration: { _refObjectName: 'Iteration 3', StartDate: '2016-02-03' }, Release: { _refObjectName: 'Release 3', ReleaseStartDate: '2016-02-03'} }
                ]
            });
            store = Ext.create('Rally.data.wsapi.Store', {
              model: model,
              data: data
            });
        });

         it('should aggregate by count with stack values', function() {
            var calculator = Ext.create('BarCalculator', {
                field: 'Priority',
                stackField: 'Severity',
                stackValues: ['', 'S1', 'S2', 'S3', 'S4'],
                calculationType: 'count'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [
                { name: 'None', type: 'bar', data: [ 0, 0, 0, 2 ] },
                { name: 'S1', type: 'bar', data: [ 1, 0, 0, 0 ] },
                { name: 'S2', type: 'bar', data: [ 0, 1, 0, 0 ] },
                { name: 'S3', type: 'bar', data: [ 0, 0, 1, 0 ] },
                { name: 'S4', type: 'bar', data: [ 0, 0, 0, 0 ] }
            ]);
        });

        it('should aggregate by estimate with stack values', function() {
            var calculator = Ext.create('BarCalculator', {
                field: 'Priority',
                stackField: 'Severity',
                stackValues: ['', 'S1', 'S2', 'S3', 'S4'],
                calculationType: 'estimate'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [
                { name: 'None', type: 'bar', data: [ 0, 0, 0, 11 ] },
                { name: 'S1', type: 'bar', data: [ 2, 0, 0, 0 ] },
                { name: 'S2', type: 'bar', data: [ 0, 3, 0, 0 ] },
                { name: 'S3', type: 'bar', data: [ 0, 0, 4, 0 ] },
                { name: 'S4', type: 'bar', data: [ 0, 0, 0, 0 ] }
            ]);
        });

         it('should aggregate by count with no stack values', function() {
            var calculator = Ext.create('ColumnCalculator', {
                field: 'Priority',
                stackField: 'Owner',
                calculationType: 'count'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [
                { name: '-- No Owner --', type: 'column', data: [ 1, 0, 0, 0 ] },
                { name: 'User1', type: 'column', data: [ 0, 1, 0, 0 ] },
                { name: 'User2', type: 'column', data: [ 0, 0, 1, 0 ] },
                { name: 'User3', type: 'column', data: [ 0, 0, 0, 2 ] }
            ]);
        });

         it('should aggregate by estimate with no stack values', function() {
            var calculator = Ext.create('ColumnCalculator', {
                field: 'Priority',
                stackField: 'Owner',
                calculationType: 'estimate'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [
                { name: '-- No Owner --', type: 'column', data: [ 2, 0, 0, 0 ] },
                { name: 'User1', type: 'column', data: [ 0, 3, 0, 0 ] },
                { name: 'User2', type: 'column', data: [ 0, 0, 4, 0 ] },
                { name: 'User3', type: 'column', data: [ 0, 0, 0, 11 ] }
            ]);
        });

        it('should order stack values by Iteration.StartDate', function() {
             var calculator = Ext.create('ColumnCalculator', {
                field: 'Priority',
                stackField: 'Iteration',
                calculationType: 'estimate'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [
                { name: 'None', type: 'column', data: [ 0, 0, 4, 0 ] },
                { name: 'Iteration 1', type: 'column', data: [ 2, 0, 0, 0 ] },
                { name: 'Iteration 2', type: 'column', data: [ 0, 0, 0, 5 ] },
                { name: 'Iteration 3', type: 'column', data: [ 0, 3, 0, 6 ] }
            ]);
        });

        it('should order stack values by Release.ReleaseStartDate', function() {
             var calculator = Ext.create('ColumnCalculator', {
                field: 'Priority',
                stackField: 'Release',
                calculationType: 'estimate'
            });
            var chartData = calculator.prepareChartData(store);
            expectChartDataToBe(chartData, [
                { name: 'None', type: 'column', data: [ 0, 0, 4, 0 ] },
                { name: 'Release 1', type: 'column', data: [ 2, 0, 0, 0 ] },
                { name: 'Release 2', type: 'column', data: [ 0, 0, 0, 5 ] },
                { name: 'Release 3', type: 'column', data: [ 0, 3, 0, 6 ] }
            ]);
        });
    });
});
