describe('CustomChartApp', function() {

    var app, query;

    function renderChart(config) {
        app = Rally.test.Harness.launchApp('CustomChartApp', Ext.merge({
            settings: {
                chartType: 'piechart'
            }
        }, config));
        return once(function() { return app.down('rallychart').componentReady; })
          .then(function() {
              return app.down('rallychart');
          });
    }

    beforeEach(function() {
        Rally.test.Mock.ajax.whenQuerying('Users').respondWith([]);
        Rally.test.Mock.ajax.whenQueryingAllowedValues('Defect', 'ScheduleState')
            .respondWith(["Defined", "In-Progress", "Completed", "Accepted"]);
        Rally.test.Mock.ajax.whenQueryingAllowedValues('Defect', 'Priority')
            .respondWith(["", "P1", "P2", "P3", "P4"]);
        var defects = Rally.test.Mock.dataFactory.getData('defect', { count: 10 });
        query = Rally.test.Mock.ajax.whenQuerying('artifact').respondWith(defects);

        var testcases = Rally.test.Mock.dataFactory.getData('testcase', { count: 10 });
        query = Rally.test.Mock.ajax.whenQuerying('artifact').respondWith(defects);
    });

    describe('configuration', function() {
        pit('should render a pie chart', function() {
            return renderChart({ settings: { chartType: 'piechart' } }).then(function(chart) {
                expect(chart.is('piechart')).toBe(true);
            });
        });

        pit('should ignore stacking, bucketing for a pie chart', function() {
            return renderChart({ settings: { chartType: 'piechart', stackField: 'Priority', bucketBy: 'week' } }).then(function(chart) {
                expect(chart.is('piechart')).toBe(true);
                expect(chart.enableStacking).toBe(false);
                expect(chart.calculator.stackField).not.toBeDefined();
                expect(chart.calculator.stackValues).not.toBeDefined();
                expect(chart.calculator.bucketBy).not.toBeDefined();
            });
        });

        pit('should render a bar chart', function() {
            return renderChart({ settings: { chartType: 'barchart' } }).then(function(chart) {
                expect(chart.is('barchart')).toBe(true);
            });
        });

        pit('should render a column chart', function() {
            return renderChart({ settings: { chartType: 'columnchart' } }).then(function(chart) {
                expect(chart.is('columnchart')).toBe(true);
            });
        });

        pit('should configure the calculator', function() {
            return renderChart({ settings: {
              chartType: 'barchart',
              aggregationField: 'Priority',
              aggregationType: 'estimate',
              bucketBy: 'week'
            } }).then(function(chart) {
                expect(chart.calculator.field).toBe('Priority');
                expect(chart.calculator.calculationType).toBe('estimate');
                expect(chart.calculator.bucketBy).toBe('week');
            });
        });

        pit('should configure the calculator', function() {
            return renderChart({ settings: {
              aggregationField: 'Priority',
              aggregationType: 'estimate'
            } }).then(function(chart) {
                expect(chart.calculator.field).toBe('Priority');
                expect(chart.calculator.calculationType).toBe('estimate');
            });
        });

        describe('when stacking', function() {
            pit('should configure stackField and values', function() {
                return renderChart({ settings: { chartType: 'barchart', stackField: 'Priority' } }).then(function(chart) {
                    expect(chart.enableStacking).toBe(true);
                    expect(chart.calculator.stackField).toBe('Priority');
                    expect(chart.calculator.stackValues).toEqual(["", "P1", "P2", "P3", "P4"]);
                });
            });

            pit('should configure stackField without values', function() {
                return renderChart({ settings: { chartType: 'barchart', stackField: 'Owner' } }).then(function(chart) {
                    expect(chart.enableStacking).toBe(true);
                    expect(chart.calculator.stackField).toBe('Owner');
                    expect(chart.calculator.stackValues).not.toBeDefined();
                });
            });
        });
    });

    describe('data querying', function() {

        pit('should query the right type for an artifact', function() {
            return renderChart({ settings: { types: 'defect' } }).then(function(chart) {
                expect(app.down('rallygridboard').modelNames).toEqual(['defect']);
                expect(app.down('rallygridboard').chartConfig.storeConfig.models).toEqual(['defect']);
                expect(app.down('rallygridboard').chartConfig.storeType).toEqual('Rally.data.wsapi.artifact.Store');
            });
        });

        pit('should query the right type for a non artifact', function() {
            return renderChart({ settings: { types: 'build' } }).then(function(chart) {
                expect(app.down('rallygridboard').modelNames).toEqual(['build']);
                expect(app.down('rallygridboard').chartConfig.storeConfig.model.typePath).toEqual('build');
                expect(app.down('rallygridboard').chartConfig.storeType).toEqual('Rally.data.wsapi.Store');
            });
        });

        pit('should include a query if specified', function() {
            return renderChart({ settings: { query: '(Severity = "Major Problem")' } }).then(function(chart) {
                var filters = app.down('rallygridboard').storeConfig.filters;
                expect(filters.length).toBe(1);
                expect(filters[0].toString()).toBe('(Severity = "Major Problem")');
            });
        });

        pit('should replace the {user} token in a query if specified', function() {
            return renderChart({ settings: { query: '((Owner = "{user}") OR (SubmittedBy = "{user}"))' } }).then(function(chart) {
                var filters = app.down('rallygridboard').storeConfig.filters;
                expect(filters.length).toBe(1);
                expect(filters[0].toString()).toBe('((Owner = "/user/123") OR (SubmittedBy = "/user/123"))');
            });
        });

        pit('should include a timeboxscope if available', function() {
            var iteration = Rally.test.Mock.dataFactory.getRecord('iteration');
            var timeboxScope = Ext.create('Rally.app.TimeboxScope', { record: iteration });
            var appContext = Rally.test.Harness.getAppContext({
                timebox: timeboxScope
            });
            return renderChart({ context: appContext, settings: { query: '(Severity = "Major Problem")' } }).then(function(chart) {
                var filters = app.down('rallygridboard').storeConfig.filters;
                expect(filters.length).toBe(2);
                expect(filters[0].toString()).toBe('(Severity = "Major Problem")');
                expect(filters[1].toString()).toBe(timeboxScope.getQueryFilter().toString());
            });
        });

        pit('should refresh when the timebox changes', function() {
            var iteration1 = Rally.test.Mock.dataFactory.getRecord('iteration'),
                iteration2 = Rally.test.Mock.dataFactory.getRecord('iteration'),
                timeboxScope1 = Ext.create('Rally.app.TimeboxScope', { record: iteration1 }),
                timeboxScope2 = Ext.create('Rally.app.TimeboxScope', { record: iteration2 }),
                appContext = Rally.test.Harness.getAppContext({
                    timebox: timeboxScope1
                });

            return renderChart({ context: appContext}).then(function(chart) {
                var destroySpy = Rally.test.Mock.spy(chart, 'destroy');
                app.onTimeboxScopeChange(timeboxScope2);
                expect(destroySpy).toHaveBeenCalled();
                return once(function() { return app.down('rallychart') && app.down('rallychart').componentReady; }).then(function() {
                    var filters = app.down('rallygridboard').storeConfig.filters;
                    expect(filters.length).toBe(1);
                    expect(filters[0].toString()).toBe(timeboxScope2.getQueryFilter().toString());
                });
            });
        });

        pit('should fetch the right fields', function() {
            return renderChart({ settings: { aggregationField: 'Priority' } }).then(function(chart) {
                expect(app.down('rallygridboard').chartConfig.storeConfig.fetch).toEqual(['FormattedID', 'Name', 'Priority']);
            });
        });

        pit('should fetch the stacking field', function() {
            return renderChart({ settings: { chartType: 'barchart', aggregationField: 'Priority', stackField: 'Severity' } }).then(function(chart) {
                expect(app.down('rallygridboard').chartConfig.storeConfig.fetch).toEqual(['FormattedID', 'Name', 'Priority', 'Severity']);
            });
        });

        pit('should fetch ReleaseStartDate when stacking by Release', function() {
            return renderChart({ settings: { chartType: 'barchart', aggregationField: 'Priority', stackField: 'Release' } }).then(function(chart) {
                expect(app.down('rallygridboard').chartConfig.storeConfig.fetch).toEqual(['FormattedID', 'Name', 'Priority', 'Release', 'ReleaseStartDate']);
            });
        });

        pit('should fetch StartDate when stacking by Iteration', function() {
            return renderChart({ settings: { chartType: 'barchart', aggregationField: 'Priority', stackField: 'Iteration' } }).then(function(chart) {
                expect(app.down('rallygridboard').chartConfig.storeConfig.fetch).toEqual(['FormattedID', 'Name', 'Priority', 'Iteration', 'StartDate']);
            });
        });

        pit('should order by the aggregation field if non-collection', function() {
            return renderChart({ settings: { aggregationField: 'Priority' } }).then(function(chart) {
                var sorters = app.down('rallygridboard').chartConfig.storeConfig.sorters;
                expect(sorters.length).toBe(1);
                expect(sorters[0]).toEqual({ property: 'Priority', direction: 'ASC' });
            });
        });

        pit('should not include an order if aggregation field is a collection', function() {
            return renderChart({ settings: { aggregationField: 'Tags' } }).then(function(chart) {
                var sorters = app.down('rallygridboard').chartConfig.storeConfig.sorters;
                expect(sorters.length).toBe(0);
            });
        });

        pit('should pass the right context', function() {
            return renderChart().then(function(chart) {
                expect(app.down('rallygridboard').context).toBe(app.getContext());
                expect(app.down('rallygridboard').chartConfig.storeConfig.context).toEqual(app.getContext().getDataContext());
            });
        });

        pit('should load all the data', function() {
            return renderChart().then(function(chart) {
                expect(app.down('rallygridboard').chartConfig.storeConfig.limit).toBe(Infinity);
            });
        });

        describe('filtering', function() {
            pit('should include default filters for artifacts', function() {
                return renderChart().then(function(chart) {
                    var filterPlugin = app.down('rallygridboard').plugins[0],
                        quickFilterPanelConfig = filterPlugin.inlineFilterButtonConfig.inlineFilterPanelConfig.quickFilterPanelConfig;
                    expect(quickFilterPanelConfig.defaultFields).toEqual(['Owner', 'State', 'ScheduleState']);
                });
            });

            pit('should not include invalid default filters', function() {
                var testcases = Rally.test.Mock.dataFactory.getData('testcase', { count: 10 });
                Rally.test.Mock.ajax.whenQuerying('artifact').respondWith(testcases);
                return renderChart({ settings: { types: 'testcase', aggregationField: 'Type' } }).then(function(chart) {
                    var filterPlugin = app.down('rallygridboard').plugins[0],
                        quickFilterPanelConfig = filterPlugin.inlineFilterButtonConfig.inlineFilterPanelConfig.quickFilterPanelConfig;
                    expect(quickFilterPanelConfig.defaultFields).toEqual(['Owner']);
                });
            });
        });
    });
});
