import { keys } from 'lodash';

function objectToNestedMap(input : object) : Map<string, Map<string, string>> {
  let result = new Map<string, Map<string, string>>();

  keys(input).forEach((key) => {
    const transitions = input[key];

    result.set(key, objectToMap<string>(transitions));
  });

  return result;
}

function objectToMap<T>(input : object) : Map<string, T> {
  let result = new Map<string, T>();

  keys(input).forEach((key) => {
    result.set(key, input[key]);
  });

  return result;
}

export { objectToNestedMap };
export { objectToMap };
