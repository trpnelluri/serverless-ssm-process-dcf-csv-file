'use strict'

let instance = null;
const clsName = 'DateTimeUtilsService'

class DateTimeUtilsService {
    
    static getInstance() {
        if (!instance) {
            instance = new DateTimeUtilsService();
        }
        return instance;
    }
    
    async formattedDate (guid, dateToFormat) {
        try {
            let dateToFormatArray = dateToFormat.split('/')
            let month = dateToFormatArray[0]
            let day = dateToFormatArray[1]
            let year = dateToFormatArray[2]
            month = (month < 10 ? '0' : '') + month;
            day = (day < 10 ? '0' : '') + day;
            hour = (hour < 10 ? '0' : '') + hour;
            const dateFormatted = month + '/' + day + '/' + year

            console.log(`${clsName},${guid},formattedDate,dateFormatted: ${dateFormatted}`);
            return dateFormatted
        } catch(err) {
            console.error(`${clsName},${guid},formattedDate,failed to convert the datetime: ${JSON.stringify(err)}`);
            return null
        }     
    }
}


module.exports = DateTimeUtilsService;