'use strict';

const { v4: uuidv4 } = require('uuid');

let instance = null;

class IdService {

    static getInstance()
    {
        if(!instance){
            instance = new IdService();
        }
        return instance;
    }

    getId() {
        return uuidv4();
    }
}

module.exports = IdService;