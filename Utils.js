Ext.define('Utils', {
    singleton: true,

    addUniqueFieldToStore: function(field,store) {
        var value = field.value,
            okToAdd = true;

        store.each(function(record){
            var savedFieldName = Utils.getFieldForAggregationType(record.get('value'));
            if ( value === savedFieldName ) {
                okToAdd = false;
            }
        });

        if ( okToAdd ) {
            store.loadRawData(field,true);
        }
    },

    getFieldForAggregationType: function(aggregationType) {
        switch(aggregationType) {
            case 'acceptedleafcount':
                return 'AcceptedLeafStoryCount';
            case 'acceptedleafplanest':
                return 'AcceptedLeafStoryPlanEstimateTotal';
            case 'leafcount':
                return 'LeafStoryCount';
            case 'leafplanest':
                return 'LeafStoryPlanEstimateTotal';
            case 'prelimest':
                return 'PreliminaryEstimateValue';
            case 'refinedest':
                return 'RefinedEstimate';
            case 'taskest':
                return 'Estimate';
            case 'taskactuals':
                return 'Actuals';
            case 'estimate':
                return 'PlanEstimate';
            default:
                return aggregationType;
        }
    }
});
