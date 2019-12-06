import LocationSearch from "../lib/wxToken/src/LocationSearch";

const testData =
  "?appid=appidappid&redirect_uri=http://baidu.com&response_type=code&scope=snsapi_base&agentid=agentId&state=STATE#wechat_redirect";

const expectData = {
  appid: "appidappid",
  redirect_uri: "http://baidu.com",
  response_type: "code",
  scope: "snsapi_base",
  agentid: "agentId",
  state: "STATE#wechat_redirect"
};

describe("my-utils: LocationSearch", () => {
  test("LocationSearch(): true", () => {
    expect(LocationSearch(testData)).toMatchObject(expectData);
  });
});
