const USPS = require('usps-webtools');
const parser = require('parse-address');

/**
 * This function parses an address that is in string format, then validates it using the USPS Shipping API
 * @param {string} addressString A string that conforms to the address format: "street1,city,zip,state"
 * @param {string} USPSid ID Code given by USPS after signing up for a developer account
 * 
 * @requires usps-webtools
 * @requires parse-address
 */
const validateAddressString = (addressString, USPSid) => {

    const parsed = parser.parseLocation(addressString); // First parse the addressString

    // Create an address object out of the parsed information
    // If some fields are not present, that's OK. Let USPS handle returning the closest match
    const address = {
        street1:
            `${parsed.number ? parsed.number : ''} ${parsed.prefix ? parsed.prefix : ''} ` +
            `${parsed.street ? parsed.street : ''} ${parsed.type ? parsed.type : ''}`,
        city: `${parsed.city ? parsed.city : ''}`,
        state: `${parsed.state ? parsed.state : ''}`,
        zip: `${parsed.zip ? parsed.zip : ''}`,
    };
    
    // Validate given address with USPS API wrapper
    const usps = new USPS({
        server: 'http://production.shippingapis.com/ShippingAPI.dll',
        userId: USPSid,
        ttl: 10000 //TTL in milliseconds for request
    });

    return new Promise((resolve, reject) => {
        usps.verify({
            street1: address.street1,
            street2: address.street2,
            city: address.city,
            state: address.state,
            zip: address.zip,
        }, function (error, closestMatch) {
            if (error) {
                return reject(error)
            }

            if (closestMatch.dpv_confirmation === 'Y') {
                // DPV Confirmation code must be 'Y' in order to ship to the given address
                return resolve(closestMatch)
            } else {
                // USPS has returned the closest match, but it is probably not a valid shipping address
                // See the USPS metadata that is returned for more information
                return reject(closestMatch)
            }
        })
    })
}

module.exports.validateAddressString = validateAddressString
