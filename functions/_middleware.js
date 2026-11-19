// Big4dle is a Daily Station original: it's played at thedailystation.com/big4dle/,
// which forwards requests here with an x-daily-station header. Anyone opening the
// main big4dle.pages.dev address directly is sent there instead. Preview builds
// (<hash>.big4dle.pages.dev) and localhost still open normally for testing.
const HOME = "https://thedailystation.com/big4dle";

export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  const viaStation = request.headers.get("x-daily-station") === "1";
  if (!viaStation && url.hostname === "big4dle.pages.dev") {
    return Response.redirect(HOME + url.pathname + url.search, 301);
  }
  return next();
}
