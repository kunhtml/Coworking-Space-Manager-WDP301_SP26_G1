import HomeNew from "./HomeNew";

export function meta() {
  return HomeNew.meta ? HomeNew.meta() : [{ title: "Home" }];
}

export default function HomeAlias() {
  return <HomeNew />;
}
