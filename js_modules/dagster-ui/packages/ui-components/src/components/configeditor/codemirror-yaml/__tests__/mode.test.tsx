import {RegExps} from '../mode';

it('recognizes a double quoted string with escaped double quotes', () => {
  expect(RegExps.QUOTED_STRING.exec('"\\""')).toEqual(expect.arrayContaining(['"\\""']));
});
