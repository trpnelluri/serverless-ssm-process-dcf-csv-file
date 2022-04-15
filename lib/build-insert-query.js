'use strict';

let instance = null;
const clsName = 'BuildInsertQueryService'

class BuildInsertQueryService {
    static getInstance() {
        if (!instance) {
            instance = new BuildInsertQueryService();
        }
        return instance;
    }

    async buildInsertQuery(guid, tableName, columns, additionalCols, insertData) {
        
        
    }

}

module.exports = BuildInsertQueryService;
