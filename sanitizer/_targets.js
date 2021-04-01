const _ = require('lodash');

function getValidKeys(mapping) {
  return _.uniq(Object.keys(mapping)).join(',');
}

function _setup( paramName, targetMap ) {
  const opts = {
    paramName: paramName,
    targetMap: targetMap
  };

  return {
    sanitize: function _sanitize( raw, clean ) {
      // error & warning messages
      var messages = { errors: [], warnings: [] };

      // the string of targets (comma delimeted)
      var targetsString = raw[opts.paramName];

      // trim whitespace
      if( _.isString( targetsString ) && !_.isEmpty( targetsString ) ){
        targetsString = targetsString.trim();

        // param must be a valid non-empty string
        if( !_.isString( targetsString ) || _.isEmpty( targetsString ) ){
          messages.errors.push(
            opts.paramName + ' parameter cannot be an empty string. Valid options: ' + getValidKeys(opts.targetMap)
          );
        } else {
          // split string in to array and lowercase each target string
          var targets = targetsString.split(',').map( function( target ){
            return target.toLowerCase(); // lowercase inputs
          });

          const positive_targets = targets.filter((t) => t[0] !== '-' );

          const negative_targets = targets.filter((t) => t[0] === '-' )
            .map((t) => t.slice(1)); // remove the leading '-' from the negative target so it can be validated easily

          // emit an error for each target *not* present in the targetMap
          positive_targets.filter( function( target ){
            return !opts.targetMap.hasOwnProperty(target);
          }).forEach( function( target ){
            messages.errors.push(
              '\'' + target + '\' is an invalid ' + opts.paramName + ' parameter. Valid options: ' + getValidKeys(opts.targetMap)
            );
          });

          // for calculating the final list of targets use either:
          // - the list of positive targets, if there are any
          // - otherwise, the list of all possible targets
          const effective_positive_targets = positive_targets.length ?
            positive_targets :
            Object.keys(opts.targetMap);

          const final_targets = effective_positive_targets.filter((t) => {
            return !negative_targets.includes(t);
          });

          // only set types value when no error occured
          if( !messages.errors.length ){
            clean[opts.paramName] = final_targets.reduce(function(acc, target) {
              return acc.concat(opts.targetMap[target]);
            }, []);

            // dedupe in case aliases expanded to common things or user typed in duplicates
            clean[opts.paramName] = _.uniq(clean[opts.paramName]);
          }
        }
      }

      // string is empty
      else if( _.isString( targetsString ) ){
        messages.errors.push(
          opts.paramName + ' parameter cannot be an empty string. Valid options: ' + getValidKeys(opts.targetMap)
        );
      }

      return messages;
    } // end of _sanitize function

  }; // end of object to be returned
} // end of _setup function


module.exports = _setup;
