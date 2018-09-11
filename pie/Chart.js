Ext.define('PieChart', {
    xtype: 'piechart',
    extend: 'Rally.ui.chart.Chart',
    requires: [
        'PieCalculator'
    ],

    config: {
        chartConfig: {
            chart: {
                type: 'pie',
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            title: {text: ''},
            tooltip: {
                headerFormat: '',
                pointFormat: '<b>{point.name}:</b> {point.percentage:.1f}% ({point.y}/{point.total})'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        format: '<b>{point.name}:</b> {point.percentage:.1f}% ({point.y}/{point.total})',
                        style: {
                            color: 'black'
                        }
                    }
                }
            }
        },
        calculatorType: 'PieCalculator'
    },

    constructor: function(config) {
        config = config || {};
        this.mergeConfig(config);
        this.callParent([this.config]);
    }
});
