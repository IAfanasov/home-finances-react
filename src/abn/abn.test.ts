import { toDashedDate } from "./abn";

describe(`#toDashedDate`, () => {
  test('the data is peanut butter', () => {
    expect(toDashedDate('20221001')).toEqual('2022-10-01');
  });
});
