interface GeneralObj {
  [propName: string]: string;
}

const LocationSearch = (search: string) => {
  let s = search.substring(search[0] === "?" ? 1 : 0);
  let a: Array<string> = [];
  if (s !== "") {
    a = s.split("&");
  }
  let kv: GeneralObj = {};
  for (let i of a) {
    let str = i.split("=");
    let k = str[0];
    let v = str[1];
    kv[k] = decodeURIComponent(v);
  }
  return kv;
};

export default LocationSearch;
