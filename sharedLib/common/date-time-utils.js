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
            console.log(`${clsName},${guid},formattedDate,dateFormatted: ${dateToFormat}`);
            let dateToFormatArray = dateToFormat.split('/')
            console.log(`${clsName},${guid},formattedDate,dateToFormatArray.length: ${dateToFormatArray.length}`);
            let month = parseInt(dateToFormatArray[0])
            let day = parseInt(dateToFormatArray[1])
            let year = parseInt(dateToFormatArray[2])
            month = (month < 10 ? '0' : '') + month;
            day = (day < 10 ? '0' : '') + day;
            //const dateFormatted = month + '/' + day + '/' + year
            const dateFormatted = month + day + year
            console.log(`${clsName},${guid},formattedDate,dateFormatted: ${dateFormatted}`);
            return dateFormatted
        } catch(err) {
            console.error(`${clsName},${guid},formattedDate,failed to convert the datetime: ${JSON.stringify(err)}`);
            return null
        }
    }
}


module.exports = DateTimeUtilsService;