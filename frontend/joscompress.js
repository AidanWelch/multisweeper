(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.joscompress = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = require('./lib/schema');
},{"./lib/schema":2}],2:[function(require,module,exports){
/**
 * Class which handles the initiation and encoding/decoding of a schema.
 * 
 */
class Schema {
    /**
     * Create an instance of the Schema class.
     * 
     * @param {Object|Array} schema The object that acts as a schema.
     */
    constructor(schema){
        if(Array.isArray(schema) || (typeof schema === 'object' && schema !== null)){
            this.schema = schema;
        } else {
            throw "The schema is invalid, it must be an array or object.";
        }
    }

    /**
     * Encode a message with the schema.
     * 
     * @param {Object|Array} message The object message, matching the schema, to encode.  All quotation marks(not apostraphes) must be escaped or errors occur.
     * @param {Boolean} [permissive=false] If true just return the message if it can't be encoded instead of erroring.
     * @returns {String} A string that has been encoded.
     */
    encode(message, permissive = false){
        var output = "";
        
        function encodeProperty(property){
            if(typeof property !== 'object' || property === null){
                if(typeof property === 'string'){
                    output = output.concat(`"${property}"`);
                } else if(typeof property === 'boolean'){
                    output = output.concat(property ? 1 : 0);
                } else {
                    output = output.concat(property);
                }
            } else if (Array.isArray(property)){
                output = output.concat('[');
                encodeArray(property);
                output = output.concat(']');
            } else if (typeof property === 'object'){
                output = output.concat('{');
                encodeObject(property);
                output = output.concat('}');
            } else {
                throw `Somehow ${property} was unable to be parsed.`;
            }
        }

        function encodeObject(object){
            let i = 0;
            for(let keys in object){
                encodeProperty(object[keys]);
                i++;
                if(i !== Object.keys(object).length){
                    output = output.concat(",");
                }
            }
        }

        function encodeArray(array){
            for(let i = 0; i < array.length; i++){
                encodeProperty(array[i]);
                if(i !== array.length-1){
                    output = output.concat(",");
                }
            }
        }

        if(Array.isArray(message)){
            encodeArray(message);
        } else if (typeof message === 'object' && message !== null) {
            encodeObject(message);
        } else if(permissive) {
            return message;
        } else {
            throw "A non-object and non-array type cannot be encoded unless permissive set to true.";
        }

        return output;
    }

    /**
     * Encode a message with the schema.
     * 
     * @param {String} message The message string to decode.
     * @returns {Object|Array} An object that has been decoded.
     */
    decode(message){
        function extractProperty(string){
            let in_string = false;
            let escaped = false; 
            let array_nesting = 0;
            let object_nesting = 0;

            for (let i = 0; i < string.length; i++){
                switch (string[i]) {
                    case ',':
                        if(!in_string && !array_nesting && !object_nesting){
                            return [string.slice(i+1), string.slice(0, i)];
                        }
                        escaped = false;
                        break;

                    case '"': 
                        if(!in_string){
                            in_string = true;
                        } else if (!escaped){
                            in_string = false;
                        }
                        escaped = false;
                        break;
                    
                    case "\\":
                        if(!escaped){
                            escaped = true;
                        } else {
                            escaped = false;
                        }
                        break;

                    case '[':
                        if(!in_string){
                            array_nesting++;
                        }
                        escaped = false;
                        break;
                    
                    case ']':
                        if(!in_string && array_nesting){
                            array_nesting--;
                        }
                        escaped = false;
                        break;
                    
                    case '{':
                        if(!in_string){
                            object_nesting++;
                        }
                        escaped = false;
                        break;

                    case '}':
                        if(!in_string && object_nesting){
                            object_nesting--;
                        }
                        escaped = false;
                        break;
                    default:
                        escaped = false;
                        break;

                }
            }
            return ["", string];
        }

        function decodeObject(object, schm){
            var result = {}
            for(let i = 0; i < Object.keys(schm).length; i++){
                let property;
                [object, property] = extractProperty(object);
                result[Object.keys(schm)[i]] = schemaIdentify(schm[Object.keys(schm)[i]], property);
            }
            return result;
        }

        function decodeArray(array, schm){
            var result = [];
            while(array.length != 0){
                let property;
                [array, property] = extractProperty(array);
                if(property !== undefined){
                    result.push(schemaIdentify(schm[0], property));
                }
            }
            return result;
        }

        function schemaIdentify(schm, string, wrapped = true){
            if(Array.isArray(schm)){
                return decodeArray((wrapped) ? string.slice(1,-1) : string, schm);
            } else if (typeof schm === 'object' && schm !== null) {
                return decodeObject((wrapped) ? string.slice(1,-1) : string, schm);
            } else if (schm === 'string'){
                return string.slice(1,-1);
            } else if(string === 'null' || string === 'undefined'){
                return (string === 'null') ? null : undefined;
            } else if (schm === 'int') {
                return parseInt(string, 10);
            } else if (schm === 'float') {
                return parseFloat(string);
            } else if (schm === 'bool'){
                return (string === '1');
            } else {
                return string;
            }
        }
        return schemaIdentify(this.schema, message, false);
    }
}

module.exports = Schema;
},{}]},{},[1])(1)
});
