import ClearDay from "./clear-day.svg";
import ClearNight from "./clear-night.svg";

import Cloudy1Day from "./cloudy-1-day.svg";
import Cloudy1Night from "./cloudy-1-night.svg";

import Cloudy2Day from "./cloudy-2-day.svg";
import Cloudy2Night from "./cloudy-2-night.svg";

import Cloudy3Day from "./cloudy-3-day.svg";
import Cloudy3Night from "./cloudy-3-night.svg";

import Cloudy from "./cloudy.svg";
import Dust from "./dust.svg";

import FogDay from "./fog-day.svg";
import FogNight from "./fog-night.svg";
import Fog from "./fog.svg";

import FrostDay from "./frost-day.svg";
import FrostNight from "./frost-night.svg";
import Frost from "./frost.svg";

import Hail from "./hail.svg";

import HazeDay from "./haze-day.svg";
import HazeNight from "./haze-night.svg";
import Haze from "./haze.svg";

import Hurricane from "./hurricane.svg";

import IsolatedThunderstormsDay from "./isolated-thunderstorms-day.svg";
import IsolatedThunderstormsNight from "./isolated-thunderstorms-night.svg";
import IsolatedThunderstorms from "./isolated-thunderstorms.svg";

import RainAndSleetMix from "./rain-and-sleet-mix.svg";
import RainAndSnowMix from "./rain-and-snow-mix.svg";

import Rainy1Day from "./rainy-1-day.svg";
import Rainy1Night from "./rainy-1-night.svg";
import Rainy1 from "./rainy-1.svg";

import Rainy2Day from "./rainy-2-day.svg";
import Rainy2Night from "./rainy-2-night.svg";
import Rainy2 from "./rainy-2.svg";

import Rainy3Day from "./rainy-3-day.svg";
import Rainy3Night from "./rainy-3-night.svg";
import Rainy3 from "./rainy-3.svg";

import ScatteredThunderstormsDay from "./scattered-thunderstorms-day.svg";
import ScatteredThunderstormsNight from "./scattered-thunderstorms-night.svg";
import ScatteredThunderstorms from "./scattered-thunderstorms.svg";

import SevereThunderstorm from "./severe-thunderstorm.svg";

import SnowAndSleetMix from "./snow-and-sleet-mix.svg";

import Snowy1Day from "./snowy-1-day.svg";
import Snowy1Night from "./snowy-1-night.svg";
import Snowy1 from "./snowy-1.svg";

import Snowy2Day from "./snowy-2-day.svg";
import Snowy2Night from "./snowy-2-night.svg";
import Snowy2 from "./snowy-2.svg";

import Snowy3Day from "./snowy-3-day.svg";
import Snowy3Night from "./snowy-3-night.svg";
import Snowy3 from "./snowy-3.svg";

import Thunderstorms from "./thunderstorms.svg";

import Tornado from "./tornado.svg";

import TropicalStorm from "./tropical-storm.svg";

import Wind from "./wind.svg";

const weatherImages = {
  "Ploi moderate": Rainy2,
  "Ploi uşoare": Rainy1,
  "Ploi moderate uneori": Rainy2,
  "soare,senin": ClearDay,
  "parțial noros": Cloudy1Day,
  noros: Cloudy,
  "cer acoperit": Cloudy,
  ceață: Fog,
  "Ploi pe porţiuni în apropiere": Rainy1,
  "Ninsori pe porţiuni în apropiere": Snowy1,
  "Lapoviță pe porţiuni în apropiere": RainAndSleetMix,
  "Burniță şi polei pe porţiuni în apropiere": Frost,
  "Ninsoare viscolită": Snowy3,
  Viscol: Tornado,
  "Ceață densă": Fog,
  "Tunete în apropiere": ScatteredThunderstorms,
  Chiciură: Frost,
  "Burniță uşoară pe porțiuni": FrostDay,
  "Burniță uşoară": FrostDay,
  "Burniță înghețată în cantităţi însemnate": Frost,
  "Burniță înghețată": Frost,
  "Ploi uşoare pe alocuri": Rainy1,
  "Ploaie torențială": Rainy3,
  "Ploaie înghețată în cantităţi mici": RainAndSleetMix,
  "Ploaie torențială uneori": Rainy3,
  "Ploaie înghețată în cantităţi mari şi moderate": RainAndSleetMix,
  "Lapoviță în cantităţi mici": RainAndSnowMix,
  "Lapoviță în cantităţi mari şi moderate": RainAndSnowMix,
  "Ninsori în cantităţi mici pe alocuri": Snowy1,
  "Ninsori în cantităţi mici": Snowy1,
  "Ninsori moderate pe alocuri": Snowy2,
  "Ninsori moderate": Snowy2,
  "Ninsori în cantităţi mari pe alocuri": Snowy3,
  "Ninsori în cantităţi însemnate": Snowy3,
  "Ploi uşoare şi de scurtă durată": Rainy1,
  Grindină: Hail,
  "Ploi de scurtă durată moderate sau  în cantităţi însemnate": Rainy2,
  "Ploaie torențială de scurtă durată": Rainy3,
  "Lapoviță de scurtă durată în cantităţi mici": RainAndSnowMix,
  "Lapoviță de scurtă durată în cantităţi mari şi moderate": RainAndSnowMix,
  "Ninsori de scurtă durată în cantităţi mici": Snowy1,
  "Ninsori de scurtă durată în cantităţi mari şi moderate": Snowy2,
  "Ploi în cantităţi mici însoţite de grindină": Hail,
  "Ploi în cantităţi mari şi moderate însoțite de grindină": Hail,
  "Ploi în cantităţi mici pe porțiuni însoțite de tunete":
    ScatteredThunderstorms,
  "Ploi în cantităţi mari şi moderate pe porțiuni însoțite de tunete":
    SevereThunderstorm,
  "Ninsori în cantităţi mari şi moderate pe porțiuni însoțite de tunete":
    Thunderstorms,
  "Ninsori în cantităţi mici pe porțiuni însoțite de tunete":
    ScatteredThunderstorms,
};

export default weatherImages;
