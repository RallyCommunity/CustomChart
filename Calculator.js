Ext.define('Calculator', {

    config: {
        calculationType: undefined,
        field: undefined,
        stackField: undefined,
        stackValues: undefined,
        bucketBy: undefined
    },

    constructor: function(config) {
        this.initConfig(config);
    },

    prepareChartData: function(store) {
        var data = this._groupData(store),
        categories = _.keys(data),
        seriesData;

        if (!this.stackField) {
            if(this.calculationType === 'count') {
                seriesData = _.map(data, function(value, key) {
                    return [key, value.length];
                });
            } else {
                seriesData = _.map(data, function(value, key) {
                    var valueTotal = _.reduce(value, function(total, r) {
                        var valueField = this._getValueFieldForCalculationType();
                        return total + r.get(valueField);
                    }, 0, this);
                    return [key, valueTotal];
                }, this);
            }
          
            return {
                categories: categories,
                series: [
                    {
                        name: this.field,
                        type: this.seriesType,
                        data: seriesData
                    }
                ]
            };
        } else {
            var stackField = store.model.getField(this.stackField),
                stackValues;

            if (this.stackValues) {
                stackValues = _.map(this.stackValues, function(stackValue) {
                    return this._getDisplayValue(stackField, stackValue);
                }, this);
            } else {
                var values = _.invoke(store.getRange(), 'get', this.stackField);
                if (this.stackField === 'Iteration' || this.stackField === 'Release') {
                    values = _.sortBy(values, function(timebox) {
                        var dateValue = timebox && (timebox.StartDate || timebox.ReleaseStartDate || null);
                        return new Date(dateValue);
                    });
                }
                stackValues = _.unique(_.map(values, function(value) {
                    return this._getDisplayValue(stackField, value);
                }, this));
            }

            var series = {};
            _.each(categories, function(category) {
                var group = data[category];
                var recordsByStackValue = _.groupBy(group, function(record) {
                    return this._getDisplayValueForField(record, this.stackField);
                }, this);
                _.each(stackValues, function(stackValue) {
                    series[stackValue] = series[stackValue] || [];
                    var records = recordsByStackValue[stackValue];
                    if(this.calculationType === 'count') {
                        series[stackValue].push((records && records.length) || 0);
                    } else {
                        var valueTotal = _.reduce(records, function(total, r) {
                            var valueField = this._getValueFieldForCalculationType();
                            return total + r.get(valueField);
                        }, 0, this);
                        series[stackValue].push(valueTotal);
                    }
                }, this);
            }, this);
          
            return {
                categories: categories,
                series: _.map(stackValues, function(value) {
                    return {
                        name: value,
                        type: this.seriesType,
                        data: series[value]
                    };
                }, this)
            };
        }
    },

    _groupData: function(store) {
        var field = store.model.getField(this.field),
            fieldType = field.getType(),
            groups = {};
        if (fieldType === 'collection') {
            _.each(store.getRange(), function(record) {
                var value = record.get(this.field),
                    values = value._tagsNameArray;
                if (_.isEmpty(values)) {
                    groups.None = groups.None || [];
                    groups.None.push(record);
                } else {
                    _.each(values, function(val) {
                        groups[val.Name] = groups[val.Name] || [];
                        groups[val.Name].push(record);
                    });
                }
            }, this);
            return groups;
        } else {
            groups = _.groupBy(store.getRange(), function(record) {
                return this._getDisplayValueForField(record, this.field);
            }, this);
            if (fieldType === 'date') {
                var dates = _.sortBy(_.compact(_.map(store.getRange(), function(record) { 
                    return record.get(this.field); 
                }, this)));
                var datesNoGaps = this._getDateRange(dates[0], dates[dates.length-1]);
                var allGroups = {};
                if (groups['-- No Entry --']) {
                    allGroups['-- No Entry --'] = groups['-- No Entry --'];
                }
                groups = _.reduce(datesNoGaps, function(accum, val) {
                    var group = this._getDisplayValue(field, moment(val).toDate()); 
                    accum[group] = groups[group] || [];
                    return accum;
                }, allGroups, this);
            }

            return groups;
        }
    },

    _getDateRange: function(startDate, endDate) {
        var currentDate = startDate;
        var datesNoGaps = [];
        var unit = 'd';
        if (this.bucketBy === 'week') {
            unit = 'w';
        } else if(this.bucketBy === 'month') {
            unit = 'M';
        } else if(this.bucketBy === 'quarter') {
            unit = 'Q';
        } else if(this.bucketBy === 'year') {
            unit = 'y';
        }

        while(currentDate <= endDate) {
            datesNoGaps.push(currentDate);
            currentDate = moment(currentDate).add(1, unit).toDate();
        }

        datesNoGaps.push(endDate);
        return datesNoGaps;
    },

    _getDisplayValueForField: function(record, fieldName) {
        var field = record.getField(fieldName),
            value = record.get(fieldName);
        
        return this._getDisplayValue(field, value);
    },

    _getDisplayValue: function(field, value) {
        if (_.isDate(value)) {
            if (!this.bucketBy || this.bucketBy === 'day') {
                return Rally.util.DateTime.formatWithDefault(value);
            } else if (this.bucketBy === 'week') {
                return Rally.util.DateTime.formatWithDefault(moment(value).startOf('week').toDate());
            } else if (this.bucketBy === 'month') {
                return moment(value).startOf('month').format('MMM \'YY');
            } else if (this.bucketBy === 'quarter') {
                return moment(value).startOf('quarter').format('YYYY [Q]Q');
            } else if (this.bucketBy === 'year') {
                return moment(value).startOf('year').format('YYYY');
            }
        } else if (_.isObject(value)) {
            return value._refObjectName;
        } else if (Ext.isEmpty(value)) {
            var fieldType = field.getType();
            if (field.attributeDefinition.SchemaType === 'User') {
                return '-- No Owner --';
            } else if (fieldType === 'rating' || fieldType === 'object') {
                return 'None';
            } else {
                return '-- No Entry --';
            }
        } else {
            return value;
        }
    },

    _getValueFieldForCalculationType: function() {
        return Utils.getFieldForAggregationType(this.calculationType);
    }
});
