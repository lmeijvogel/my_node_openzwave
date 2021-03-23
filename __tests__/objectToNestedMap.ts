import { keys } from 'lodash';

function objectToNestedMap<T>(input : object) : Map<T, Map<string, string>> {
  let result = new Map<T, Map<string, string>>();

  keys(input).forEach((key) => {
    const transitions = input[key];

    result.set(key as any, objectToMap<string>(transitions));
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
