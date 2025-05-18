import ClearDay from "../assets/weather-icons/clear-day.svg";


import Cloudy1Day from "../assets/weather-icons/cloudy-1-day.svg";

import Cloudy from "../assets/weather-icons/cloudy.svg";
import Fog from "../assets/weather-icons/fog.svg";

import FrostDay from "../assets/weather-icons/frost-day.svg";
import Frost from "../assets/weather-icons/frost.svg";

import Hail from "../assets/weather-icons/hail.svg";

import Hurricane from "../assets/weather-icons/hurricane.svg";

import IsolatedThunderstormsDay from "../assets/weather-icons/isolated-thunderstorms-day.svg";
import IsolatedThunderstormsNight from "../assets/weather-icons/isolated-thunderstorms-night.svg";
import IsolatedThunderstorms from "../assets/weather-icons/isolated-thunderstorms.svg";

import RainAndSleetMix from "../assets/weather-icons/rain-and-sleet-mix.svg";
import RainAndSnowMix from "../assets/weather-icons/rain-and-snow-mix.svg";

import Rainy1Day from "../assets/weather-icons/rainy-1-day.svg";
import Rainy1Night from "../assets/weather-icons/rainy-1-night.svg";
import Rainy1 from "../assets/weather-icons/rainy-1.svg";

import Rainy2 from "../assets/weather-icons/rainy-2.svg";

import Rainy3Day from "../assets/weather-icons/rainy-3-day.svg";
import Rainy3Night from "../assets/weather-icons/rainy-3-night.svg";
import Rainy3 from "../assets/weather-icons/rainy-3.svg";

import ScatteredThunderstormsDay from "../assets/weather-icons/scattered-thunderstorms-day.svg";
import ScatteredThunderstormsNight from "../assets/weather-icons/scattered-thunderstorms-night.svg";
import ScatteredThunderstorms from "../assets/weather-icons/scattered-thunderstorms.svg";

import SevereThunderstorm from "../assets/weather-icons/severe-thunderstorm.svg";

import SnowAndSleetMix from "../assets/weather-icons/snow-and-sleet-mix.svg";

import Snowy1Day from "../assets/weather-icons/snowy-1-day.svg";
import Snowy1Night from "../assets/weather-icons/snowy-1-night.svg";
import Snowy1 from "../assets/weather-icons/snowy-1.svg";

import Snowy2Day from "../assets/weather-icons/snowy-2-day.svg";
import Snowy2Night from "../assets/weather-icons/snowy-2-night.svg";
import Snowy2 from "../assets/weather-icons/snowy-2.svg";

import Snowy3Day from "../assets/weather-icons/snowy-3-day.svg";
import Snowy3Night from "../assets/weather-icons/snowy-3-night.svg";
import Snowy3 from "../assets/weather-icons/snowy-3.svg";

import Thunderstorms from "../assets/weather-icons/thunderstorms.svg";

import Tornado from "../assets/weather-icons/tornado.svg";

import TropicalStorm from "../assets/weather-icons/tropical-storm.svg";

import Wind from "../assets/weather-icons/wind.svg";

const weatherImages = {
  "Ploi moderate": Rainy2,
  "Ploi uşoare": Rainy1,
  "Ploi moderate uneori": Rainy2,
  "soare,senin": ClearDay,
  "parțial noros": Cloudy1Day,
  noros: Cloudy,
  "cer acoperit": Cloudy,
  "Ceață": Fog,
  "Ploi pe porţiuni în apropiere": Rainy1,
  "Ninsori pe porţiuni în apropiere": Snowy1,
  "Lapoviță pe porţiuni în apropiere": RainAndSleetMix,
  "Burniță şi polei pe porţiuni în apropiere": Frost,
  "Ninsoare viscolită": Snowy3,
  "Viscol": Tornado,
  "Ceață densă": Fog,
  "Tunete în apropiere": ScatteredThunderstorms,
  "Chiciură": Frost,
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
  "Grindină": Hail,
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
