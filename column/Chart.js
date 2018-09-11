Ext.define('ColumnChart', {
    xtype: 'columnchart',
    extend: 'Rally.ui.chart.Chart',
    requires: [
        'ColumnCalculator'
    ],

    config: {
        chartConfig: {
            chart: { type: 'column' },
            title: {
                text: ''
            },
            yAxis: {
                min: 0,
                title: {
                    text: ''
                },
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: 'gray'
                    }
                },
                reversedStacks: false
            },
            plotOptions: {
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: false
                    },
                    showInLegend: false,
                    colorByPoint: true
                }
            }
        },
        calculatorType: 'ColumnCalculator'
    },

    constructor: function(config) {
        config = config || {};
        this.mergeConfig(config);

        this.chartConfig.plotOptions.column.showInLegend = this.enableStacking;
        this.chartConfig.plotOptions.column.colorByPoint = !this.enableStacking;
        
        if (!this.enableStacking) {
            this.chartConfig.tooltip = {
                headerFormat: '',
                pointFormat: '{point.name}: <b>{point.y}</b>'
            };
        }
        this.callParent([this.config]);
    }
});
